import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  GenderPreference,
  ListingStatus,
  Prisma,
  PropertyType,
  RoomType,
} from '@prisma/client';

import { LocationInsightsService } from '../location-insights/location-insights.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListingSearchFilters, VectorMatch } from './rag.interfaces';

type ChatHistoryItem = { role: 'user' | 'model'; text: string };

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly ai: GoogleGenAI;
  private readonly embeddingModel = 'gemini-embedding-001';
  private readonly generationModel = 'gemini-2.5-flash';
  private readonly maxFilteredListings = 80;
  private readonly maxVectorMatches = 5;
  private readonly relevanceThreshold = Number(
    process.env.RAG_RELEVANCE_THRESHOLD ?? 0.72,
  );
 private readonly searchableListingStatuses: ListingStatus[] = [
  ListingStatus.ACTIVE,
  ListingStatus.APPROVED,
];

  private readonly LOCATION_ALIASES: Record<string, string> = {
    'القاهره': 'القاهرة',
    'cairo': 'القاهرة',
    'مدينة نصر': 'مدينه نصر',
    'مدينه نصر': 'مدينه نصر',
    'nasr city': 'مدينه نصر',
    'الرحاب': 'el rehab',
    'el rehab': 'el rehab',
    'maadi': 'المعادي',
    'المعادي': 'المعادي',
    'giza': 'الجيزة',
    'الجيزه': 'الجيزة',
    'alexandria': 'الإسكندرية',
    'الإسكندريه': 'الإسكندرية',
    'mansoura': 'المنصورة',
    'المنصوره': 'المنصورة',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly locationInsightsService: LocationInsightsService,
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async syncListingToVectorDB(listingId: number): Promise<void> {
    // Ingestion now embeds a richer, retrieval-optimized text chunk instead of
    // only the basic listing fields, so semantic search can understand amenities,
    // rooms, rental rules, and cached area context.
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId },
      include: {
        amenities: true,
        rooms: { include: { images: true }, orderBy: { roomNumber: 'asc' } },
        area: true,
        category: true,
        locationInsight: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found.`);
    }

    this.logger.log(
      `[RAG DEBUG] listing=${listing.id} status=${listing.status} isDeleted=${listing.isDeleted} allowedStatuses=${JSON.stringify(this.searchableListingStatuses)}`
    );

    if (
      listing.isDeleted ||
      !this.searchableListingStatuses.includes(listing.status as ListingStatus)
    ) {
      throw new BadRequestException(
        `Listing ${listing.id} cannot be indexed because status=${listing.status} and isDeleted=${listing.isDeleted}. Only ACTIVE or APPROVED, non-deleted listings are allowed.`,
      );
    }

    const textChunk = this.buildListingTextChunk(listing);

    try {
      const vectorValues = await this.createEmbedding(textChunk, 'listing-sync');

      if (vectorValues.length === 0) {
        throw new Error(`Listing ${listing.id} embedding is empty.`);
      }

      console.log(
        `Listing ${listing.id} embedded (${vectorValues.length} dimensions)`,
      );

      await this.prisma.listingVector.upsert({
        where: { listingId: listing.id },
        update: {
          vectorText: vectorValues,
          textChunk,
        },
        create: {
          listingId: listing.id,
          vectorText: vectorValues,
          textChunk,
        },
      });

      this.logger.log(
        `[RAG Sync] Listing ${listing.id} vector saved successfully (${vectorValues.length} dimensions).`,
      );
    } catch (error) {
      this.logRuntimeError(
        `[RAG Sync] Failed to process listing ${listingId}`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to process and store vector embedding: ${this.errorMessage(
          error,
        )}`,
      );
    }
  }

  async rebuildAllApprovedListings() {
    const listings = await this.prisma.listing.findMany({
      where: {
        status: {
          in: this.searchableListingStatuses,
        },
        isDeleted: false,
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    let processed = 0;
    let failed = 0;

    for (const listing of listings) {
      console.log(`Syncing listing ${listing.id}...`);

      try {
        await this.syncListingToVectorDB(listing.id);
        processed++;
        console.log(`✓ Listing ${listing.id} indexed`);
      } catch (error) {
        failed++;
        console.error(`✗ Failed listing ${listing.id}`);
        this.logRuntimeError(
          `[RAG Rebuild] Failed listing ${listing.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `[RAG Rebuild] Finished. processed=${processed}, failed=${failed}`,
    );

    return {
      success: true,
      processed,
      failed,
    };
  }

  private async getTotalIndexedListings(): Promise<number> {
    const count = await this.prisma.listingVector.count();
    return count;
  }

  async generateRAGResponse(
    studentQuery: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    try {
      // Retrieval order is intentionally: filters -> SQL -> vector search -> AI.
      // This keeps hard constraints such as city, rent, and status out of the
      // embedding model and prevents inactive/draft listings from leaking.
      const filters = await this.extractFilters(studentQuery, history);
      let filteredListings = await this.findApprovedListings(filters);

      // Retry logic: if initial filtering returns 0 listings, try progressively looser filters
      if (filteredListings.length === 0) {
        this.logger.log('[RAG Search] SQL filtering returned 0 listings. Starting retry logic.');

        // Retry 1: Only rent filters (remove location constraints)
        if (filters.maxRent !== undefined || filters.minRent !== undefined) {
          this.logger.log('[RAG Search] Retry 1: Using only rent filters');
          const rentOnlyFilters: ListingSearchFilters = {
            maxRent: filters.maxRent,
            minRent: filters.minRent,
          };
          filteredListings = await this.findApprovedListings(rentOnlyFilters);
          if (filteredListings.length > 0) {
            this.logger.log(`[RAG Search] Retry 1 succeeded: ${filteredListings.length} listings found`);
          }
        }

        // Retry 2: Only governorate (remove city and area constraints)
        if (filteredListings.length === 0 && filters.governorate) {
          this.logger.log('[RAG Search] Retry 2: Using only governorate filter');
          const governorateOnlyFilters: ListingSearchFilters = {
            governorate: filters.governorate,
          };
          filteredListings = await this.findApprovedListings(governorateOnlyFilters);
          if (filteredListings.length > 0) {
            this.logger.log(`[RAG Search] Retry 2 succeeded: ${filteredListings.length} listings found`);
          }
        }

        // Retry 3: No location filters, only non-location constraints
        if (filteredListings.length === 0) {
          this.logger.log('[RAG Search] Retry 3: Using only non-location filters');
          const nonLocationFilters: ListingSearchFilters = {
            maxRent: filters.maxRent,
            minRent: filters.minRent,
            furnished: filters.furnished,
            internetIncluded: filters.internetIncluded,
            utilitiesIncluded: filters.utilitiesIncluded,
            genderPreference: filters.genderPreference,
            roomType: filters.roomType,
            propertyType: filters.propertyType,
          };
          filteredListings = await this.findApprovedListings(nonLocationFilters);
          if (filteredListings.length > 0) {
            this.logger.log(`[RAG Search] Retry 3 succeeded: ${filteredListings.length} listings found`);
          }
        }

        // Final fallback: Get all approved listings and rely on vector search
        if (filteredListings.length === 0) {
          this.logger.log('[RAG Search] Retry 4: Getting all approved listings for vector search');
          const allApprovedFilters: ListingSearchFilters = {};
          filteredListings = await this.findApprovedListings(allApprovedFilters);
          if (filteredListings.length > 0) {
            this.logger.log(`[RAG Search] Retry 4 succeeded: ${filteredListings.length} listings found`);
          }
        }

        if (filteredListings.length === 0) {
          this.logger.log('[RAG Search] All retry attempts failed. No listings available.');
          return 'لم أجد سكنًا مناسبًا بناءً على طلبك.';
        }
      }

      // Gemini embeddings are still used, but only after deterministic Prisma
      // filtering has reduced the candidate set.
      const queryVector = await this.createEmbedding(studentQuery, 'query');
      const vectorRows = await this.prisma.listingVector.findMany({
        where: {
          listingId: {
            in: filteredListings.map((listing) => listing.id),
          },
        },
      });

      if (vectorRows.length === 0) {
        this.logger.warn(
          '[RAG Search] Empty vector database for SQL-filtered listings.',
        );
        return 'لم أجد سكنًا مناسبًا بناءً على طلبك.';
      }

      const matches = this.searchVectors(vectorRows, queryVector);
      const topScore = matches[0]?.similarity ?? 0;

      // Dynamic threshold based on dataset size
      const totalIndexedListings = await this.getTotalIndexedListings();
      const dynamicThreshold =
        totalIndexedListings < 20 ? 0.60 : this.relevanceThreshold;

      this.logger.log(`[RAG Search] Total indexed listings: ${totalIndexedListings}`);
      this.logger.log(`[RAG Search] Dynamic threshold: ${dynamicThreshold}`);
      this.logger.log(`[RAG Search] Vector matches returned: ${matches.length}`);
      this.logger.log(`[RAG Search] Top similarity score: ${topScore}`);

      // Fallback: if we have filtered listings and vector matches, allow Gemini to answer
      // even if similarity is below threshold (useful for small datasets)
      const shouldReject =
        matches.length === 0 ||
        (topScore < dynamicThreshold && filteredListings.length === 0);

      if (shouldReject) {
        this.logger.log(
          `[RAG Search] Rejected: matches=${matches.length}, topScore=${topScore}, threshold=${dynamicThreshold}, reason=${matches.length === 0 ? 'no matches' : 'below threshold'}`,
        );
        return 'لم أجد سكنًا مناسبًا بناءً على طلبك.';
      }

      if (topScore < dynamicThreshold) {
        this.logger.log(
          `[RAG Search] Below threshold but proceeding with fallback: filteredListings=${filteredListings.length}, matches=${matches.length}, topScore=${topScore}, threshold=${dynamicThreshold}`,
        );
      }

      const listingById = new Map(
        filteredListings.map((listing) => [listing.id, listing]),
      );
      const context = await this.buildResponseContext(matches, listingById);

      if (!context) {
        this.logger.warn('[RAG Search] Empty response context after matching.');
        return 'لم أجد سكنًا مناسبًا بناءً على طلبك.';
      }

      const response = await this.generateArabicAnswer(
        studentQuery,
        history,
        filters,
        context,
      );

      return response || 'لم أتمكن من صياغة رد مناسب الآن.';
    } catch (error) {
      this.logRuntimeError('[RAG Runtime] generateRAGResponse failed', error);
      throw new InternalServerErrorException(
        `تعذر البحث في بيانات السكن الآن: ${this.errorMessage(error)}`,
      );
    }
  }

  private async createEmbedding(text: string, label: string): Promise<number[]> {
    const response = await this.ai.models.embedContent({
      model: this.embeddingModel,
      contents: text,
    });

    this.logger.log(`[RAG Embedding] ${label} text length: ${text.length}`);
    this.logger.log(
      `[RAG Embedding] ${label} embeddings returned: ${
        response.embeddings?.length ?? 0
      }`,
    );

    const vectorValues = response.embeddings?.[0]?.values;

    if (!vectorValues || vectorValues.length === 0) {
      throw new Error(`Missing embedding values for ${label}.`);
    }

    this.assertNumericVector(vectorValues, `generated ${label} embedding`);
    this.logger.log(
      `[RAG Embedding] ${label} generated embedding values count: ${vectorValues.length}`,
    );
    this.logger.log(
      `[RAG Embedding] ${label} embedding length: ${vectorValues.length}`,
    );

    return vectorValues;
  }

  private async extractFilters(
    studentQuery: string,
    history: ChatHistoryItem[],
  ): Promise<ListingSearchFilters> {
    // Gemini extracts structured filters, but failures never stop search; an
    // empty filter object falls back to approved listings plus vector relevance.
    const systemInstruction = `
      Extract structured housing search filters from the latest user question.
      Return only valid JSON. Do not include markdown.
      Allowed keys: city, governorate, area, maxRent, minRent, furnished, internetIncluded, utilitiesIncluded, genderPreference, roomType, propertyType.
      Allowed genderPreference values: MALE, FEMALE, ANY.
      Allowed roomType values: ENTIRE_PLACE, PRIVATE_ROOM, SHARED_ROOM.
      Allowed propertyType values: APARTMENT, HOUSE, VILLA, CABIN, STUDIO, OTHER.
      Omit keys that are not clearly requested.
    `;

    const prompt = `
      Recent chat:
      ${history
        .slice(-6)
        .map((item) => `${item.role}: ${item.text}`)
        .join('\n')}

      Latest user question:
      ${studentQuery}
    `;

    try {
      const output = await this.ai.models.generateContent({
        model: this.generationModel,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0,
        },
      });

      const raw = output.text?.trim() ?? '{}';
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/```$/i, '');
      const parsed = JSON.parse(jsonText);

      this.logger.log(`[RAG Filters Raw] ${JSON.stringify(parsed)}`);

      const filters = this.normalizeFilters(parsed);

      this.logger.log(`[RAG Filters Normalized] ${JSON.stringify(filters)}`);
      return filters;
    } catch (error) {
      this.logRuntimeError('[RAG Filters] Gemini extraction failed', error);
      return {};
    }
  }

  private normalizeFilters(value: Record<string, unknown>): ListingSearchFilters {
    const filters: ListingSearchFilters = {};

    if (typeof value.city === 'string' && value.city.trim()) {
      filters.city = this.applyLocationAlias(value.city.trim());
    }

    if (typeof value.governorate === 'string' && value.governorate.trim()) {
      filters.governorate = this.applyLocationAlias(value.governorate.trim());
    }

    if (typeof value.area === 'string' && value.area.trim()) {
      filters.area = this.applyLocationAlias(value.area.trim());
    }

    if (typeof value.maxRent === 'number' && Number.isFinite(value.maxRent)) {
      filters.maxRent = Math.max(0, Math.floor(value.maxRent));
    }

    if (typeof value.minRent === 'number' && Number.isFinite(value.minRent)) {
      filters.minRent = Math.max(0, Math.floor(value.minRent));
    }

    for (const key of [
      'furnished',
      'internetIncluded',
      'utilitiesIncluded',
    ] as const) {
      if (typeof value[key] === 'boolean') {
        filters[key] = value[key];
      }
    }

    if (
      typeof value.genderPreference === 'string' &&
      Object.values(GenderPreference).includes(
        value.genderPreference as GenderPreference,
      )
    ) {
      filters.genderPreference = value.genderPreference as GenderPreference;
    }

    if (
      typeof value.roomType === 'string' &&
      Object.values(RoomType).includes(value.roomType as RoomType)
    ) {
      filters.roomType = value.roomType as RoomType;
    }

    if (
      typeof value.propertyType === 'string' &&
      Object.values(PropertyType).includes(value.propertyType as PropertyType)
    ) {
      filters.propertyType = value.propertyType as PropertyType;
    }

    return filters;
  }

  private async findApprovedListings(filters: ListingSearchFilters) {
    // Status and deletion checks are hard-coded safety rails for RAG. The AI
    // layer only searches approved, non-deleted listings regardless of prompt.
    const where: Prisma.ListingWhereInput = {
      status: {
        in: this.searchableListingStatuses,
      },
      isDeleted: false,
      ...(filters.city && {
        city: { contains: filters.city },
      }),
      ...(filters.governorate && {
        governorate: { contains: filters.governorate },
      }),
      ...(filters.area && {
        area: { name: { contains: filters.area } },
      }),
      ...(filters.maxRent !== undefined && {
        monthlyRent: { lte: filters.maxRent },
      }),
      ...(filters.minRent !== undefined && {
        monthlyRent: {
          ...(filters.maxRent !== undefined && { lte: filters.maxRent }),
          gte: filters.minRent,
        },
      }),
      ...(filters.furnished !== undefined && {
        furnished: filters.furnished,
      }),
      ...(filters.internetIncluded !== undefined && {
        internetIncluded: filters.internetIncluded,
      }),
      ...(filters.utilitiesIncluded !== undefined && {
        utilitiesIncluded: filters.utilitiesIncluded,
      }),
      ...(filters.genderPreference && {
        genderPreference: filters.genderPreference,
      }),
      ...(filters.roomType && {
        roomType: filters.roomType,
      }),
      ...(filters.propertyType && {
        propertyType: filters.propertyType,
      }),
    };

    this.logger.log(`[RAG SQL] city=${filters.city || 'none'}`);
    this.logger.log(`[RAG SQL] governorate=${filters.governorate || 'none'}`);
    this.logger.log(`[RAG SQL] area=${filters.area || 'none'}`);
    this.logger.log(`[RAG SQL] maxRent=${filters.maxRent ?? 'none'}`);
    this.logger.log(`[RAG SQL] minRent=${filters.minRent ?? 'none'}`);

    const listings = await this.prisma.listing.findMany({
      where,
      take: this.maxFilteredListings,
      orderBy: { updatedAt: 'desc' },
      include: {
        area: true,
        category: true,
        amenities: true,
        rooms: { include: { images: true }, orderBy: { roomNumber: 'asc' } },
        locationInsight: true,
      },
    });

    this.logger.log(`[RAG SQL] Filtered approved listings: ${listings.length}`);
    return listings;
  }

  private searchVectors(
    rows: Array<{ listingId: number; vectorText: Prisma.JsonValue; textChunk: string }>,
    queryVector: number[],
  ): VectorMatch[] {
    // Vectors are scored in TypeScript so malformed JSON, wrong dimensions, or
    // corrupted values can be skipped per listing instead of failing the request.
    const matches: VectorMatch[] = [];

    for (const row of rows) {
      const storedVector = this.parseStoredVector(row.vectorText, row.listingId);

      if (!storedVector) {
        continue;
      }

      if (storedVector.length !== queryVector.length) {
        this.logger.warn(
          `[RAG Vector Integrity] Dimension mismatch for listing ${row.listingId}. stored=${storedVector.length}, query=${queryVector.length}`,
        );
        continue;
      }

      matches.push({
        listingId: row.listingId,
        textChunk: row.textChunk,
        similarity: this.cosineSimilarity(queryVector, storedVector),
      });
    }

    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.maxVectorMatches);
  }

  private parseStoredVector(
    value: Prisma.JsonValue,
    listingId: number,
  ): number[] | null {
    let parsed: unknown = value;

    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (error) {
        this.logRuntimeError(
          `[RAG Vector Integrity] Corrupted JSON vector for listing ${listingId}`,
          error,
        );
        return null;
      }
    }

    if (!Array.isArray(parsed)) {
      this.logger.warn(
        `[RAG Vector Integrity] Malformed vector for listing ${listingId}: not an array.`,
      );
      return null;
    }

    const numericVector = parsed.map((item) =>
      typeof item === 'number' ? item : Number(item),
    );

    try {
      this.assertNumericVector(numericVector, `stored vector ${listingId}`);
      return numericVector;
    } catch (error) {
      this.logRuntimeError(
        `[RAG Vector Integrity] Invalid vector values for listing ${listingId}`,
        error,
      );
      return null;
    }
  }

  private assertNumericVector(vector: number[], label: string) {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error(`${label} is empty or missing.`);
    }

    const invalidIndex = vector.findIndex(
      (item) => typeof item !== 'number' || !Number.isFinite(item),
    );

    if (invalidIndex !== -1) {
      throw new Error(`${label} has invalid value at index ${invalidIndex}.`);
    }
  }

  private cosineSimilarity(a: number[], b: number[]) {
    let dot = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;

    for (let index = 0; index < a.length; index++) {
      dot += a[index] * b[index];
      aMagnitude += a[index] * a[index];
      bMagnitude += b[index] * b[index];
    }

    if (aMagnitude === 0 || bMagnitude === 0) {
      return 0;
    }

    return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
  }

  private async buildResponseContext(
    matches: VectorMatch[],
    listingById: Map<number, any>,
  ): Promise<string> {
    const blocks = await Promise.all(
      matches.map(async (match) => {
        const listing = listingById.get(match.listingId);

        if (!listing) {
          return null;
        }

        const insight = await this.getCachedOrGeneratedLocationInsight(
          match.listingId,
          listing.locationInsight,
        );

        return `
          Similarity score: ${match.similarity.toFixed(4)}
          ${match.textChunk}
          Cached location insight: ${this.formatLocationInsight(insight)}
        `.trim();
      }),
    );

    return blocks.filter(Boolean).join('\n\n---\n\n');
  }

  private async getCachedOrGeneratedLocationInsight(
    listingId: number,
    currentInsight: any,
  ) {
    // Prefer cached insights to avoid calling Overpass on every RAG request.
    // Live generation is only a fallback for listings that have no cache yet.
    if (currentInsight) {
      return currentInsight;
    }

    const cached = await this.prisma.listingLocationInsight.findUnique({
      where: { listingId },
    });

    if (cached) {
      return cached;
    }

    try {
      return await this.locationInsightsService.generateForListingAutomatically(
        listingId,
      );
    } catch (error) {
      this.logRuntimeError(
        `[RAG Location] Failed to generate location insight for listing ${listingId}`,
        error,
      );
      return null;
    }
  }

  private async generateArabicAnswer(
    studentQuery: string,
    history: ChatHistoryItem[],
    filters: ListingSearchFilters,
    context: string,
  ) {
    const systemInstruction = `
      You are Morafeq's Arabic student housing assistant.
      Answer only from the verified listing context.
      Never invent listings, prices, facilities, availability, or nearby services.
      If the context does not satisfy the request, answer exactly: لم أجد سكنًا مناسبًا بناءً على طلبك.
      Keep recommendations concise, practical, and student-friendly.
      Mention rent, city/area, room type, furnishing, internet/utilities, and important rules when available.
    `;

    const prompt = `
      Extracted filters:
      ${JSON.stringify(filters)}

      Recent chat:
      ${history
        .slice(-6)
        .map((item) => `${item.role}: ${item.text}`)
        .join('\n')}

      Verified context:
      ${context}

      Student question:
      ${studentQuery}
    `;

    const output = await this.ai.models.generateContent({
      model: this.generationModel,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return output.text?.trim();
  }

  private buildListingTextChunk(listing: any) {
    const amenities = listing.amenities
      ?.map((amenity: any) => amenity.amenityKey)
      .filter(Boolean)
      .join(', ');

    const rooms = listing.rooms
      ?.map((room: any) =>
        [
          `Room ${room.roomNumber}`,
          room.roomName ? `name ${room.roomName}` : null,
          `capacity ${room.capacity}`,
          `occupied ${room.occupiedCount ?? 0}`,
          room.images?.length ? `${room.images.length} images` : null,
        ]
          .filter(Boolean)
          .join(', '),
      )
      .join(' | ');

    return `
      Listing ID: ${listing.id}
      Title: ${listing.title}
      Description: ${listing.description}
      Property: ${this.humanize(listing.propertyType)} with ${this.humanize(
        listing.roomType,
      )}.
      Capacity and layout: max ${listing.maxTenants} tenants, ${listing.bedrooms} bedrooms, ${listing.beds} beds, ${listing.bathrooms} bathrooms.
      Rooms: ${rooms || 'No individual room details recorded.'}
      Location: ${listing.streetName}, ${listing.area?.name || 'unknown area'}, ${listing.city}, ${listing.governorate}, ${listing.country}.
      Landmark and arrival: ${listing.nearbyLandmark || 'No landmark'}; ${listing.arrivalInstructions || 'No arrival instructions'}.
      Rental details: ${listing.monthlyRent} ${listing.currency} monthly rent, ${listing.depositAmount} ${listing.currency} deposit, minimum stay ${listing.minimumStayMonths} months, maximum stay ${listing.maximumStayMonths ?? 'not specified'} months.
      Availability: available from ${this.formatDate(listing.availableFrom)}.
      Included services: furnished ${listing.furnished ? 'yes' : 'no'}, internet ${listing.internetIncluded ? 'included' : 'not included'}, utilities ${listing.utilitiesIncluded ? 'included' : 'not included'}.
      Amenities: ${amenities || 'No amenities recorded.'}
      Preferences and rules: gender preference ${listing.genderPreference}, smoking policy ${this.humanize(listing.smokingPolicy)}.
      Area insight: ${this.formatLocationInsight(listing.locationInsight)}
      Status: ${listing.status}.
    `.trim();
  }

  private formatLocationInsight(insight: any) {
    if (!insight) {
      return 'No cached location insight available.';
    }

    return [
      insight.nearbyServices
        ? `nearby services ${JSON.stringify(insight.nearbyServices)}`
        : null,
      insight.advantages
        ? `advantages ${JSON.stringify(insight.advantages)}`
        : null,
      insight.disadvantages
        ? `disadvantages ${JSON.stringify(insight.disadvantages)}`
        : null,
    ]
      .filter(Boolean)
      .join('; ');
  }

  private humanize(value: string) {
    return value?.replace(/_/g, ' ').toLowerCase();
  }

  private normalizeArabic(text?: string): string | undefined {
    if (!text) return text;

    return text
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private applyLocationAlias(text?: string): string | undefined {
    if (!text) return text;
    const normalized = this.normalizeArabic(text);
    return this.LOCATION_ALIASES[normalized || ''] || normalized;
  }

  private formatDate(value: Date | string) {
    return new Date(value).toISOString().slice(0, 10);
  }

  private logRuntimeError(message: string, error: unknown) {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
      return;
    }

    this.logger.error(`${message}: ${JSON.stringify(error)}`);
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
