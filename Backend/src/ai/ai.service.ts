import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Injectable()
export class RagService {
  private ai: GoogleGenAI;

  constructor(private prisma: PrismaService, private httpService: HttpService) {
    // Initialize the official Google Gen AI SDK
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * 1. INGESTION PHASE (MySQL Edition)
   * Run this when a listing is created or modified.
   */
  async syncListingToVectorDB(listingId: number): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, isDeleted: false },
      include: {
        amenities: true,
        rooms: true,
        area: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${listingId} not found.`);
    }

    // Build the structural paragraph for semantic AI lookup
    const textChunk = `
      Listing ID: ${listing.id}
      Title: ${listing.title}
      Description: ${listing.description}
      Configuration: This is a ${listing.roomType.replace(/_/g, ' ')} inside a ${listing.propertyType.toLowerCase()}.
      Capacity: Accommodates up to ${listing.maxTenants} students. Has ${listing.bedrooms} bedrooms, ${listing.beds} beds, and ${listing.bathrooms} bathrooms.
      Financials: Monthly rent is ${listing.monthlyRent} ${listing.currency}. Security deposit is ${listing.depositAmount} ${listing.currency}.
      Location: Located in ${listing.city}, ${listing.governorate}, near ${listing.nearbyLandmark || 'local amenities'}. Area: ${listing.area?.name || 'N/A'}.
      Inclusions: Internet is ${listing.internetIncluded ? 'INCLUDED' : 'NOT INCLUDED'}. Utilities are ${listing.utilitiesIncluded ? 'INCLUDED' : 'PAID SEPARATELY'}. Furnished: ${listing.furnished ? 'YES' : 'NO'}.
      Rules: Gender preference: ${listing.genderPreference}. Smoking policy: ${listing.smokingPolicy.replace(/_/g, ' ')}.
      Status: Currently ${listing.status}.
    `.trim();

    try {
      // Generate numeric vector embedding (768 numbers)
      const embeddingResponse = await this.ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: textChunk,
      });

      if (!embeddingResponse.embeddings || embeddingResponse.embeddings.length === 0) {
        throw new InternalServerErrorException('Failed to generate embedding from Google API.');
      }

      const vectorValues = embeddingResponse.embeddings[0].values;
      if (!vectorValues) {
        throw new InternalServerErrorException('Embedding values missing from Google API response.');
      }

      // Save or update directly in your MySQL listing_vectors table via Prisma
      await this.prisma.listingVector.upsert({
        where: { listingId: listing.id },
        update: {
          vectorText: vectorValues,
          textChunk: textChunk,
        },
        create: {
          listingId: listing.id,
          vectorText: vectorValues,
          textChunk: textChunk,
        },
      });
    } catch (err) {
      console.error(`[MySQL RAG Ingestion Error] Failed for listing ${listingId}:`, err);
      throw new InternalServerErrorException('Failed to process and store vector embedding.');
    }
  }

  /**
   * 2. RETRIEVAL & GENERATION PHASE (Conversational MySQL Edition)
   */
  async generateRAGResponse(
    studentQuery: string,
    userId: number,
    history: ChatMessage[] = [],
  ): Promise<string> {
    try {
      let searchInterfaceQuery = studentQuery;

      // Step A1: If chat history exists, condense the follow-up question into a standalone vector search query
      if (history.length > 0) {
        const historySummary = history
          .map((msg) => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`)
          .join('\n');

        const rewritePrompt = `
          Given the following conversation history and a follow-up question, rewrite the follow-up question into a standalone search phrase or question that contains all structural context (location, property rules, preferences) required for an optimized vector database search. Do not write a conversational reply, only return the standalone search query.
          
          Chat History:
          ${historySummary}
          
          Follow-up Question: "${studentQuery}"
          
          Standalone Question:
        `;

        const rewriteOutput = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: rewritePrompt,
        });

        if (rewriteOutput.text) {
          searchInterfaceQuery = rewriteOutput.text.trim();
        }
      }

      // Step A2: Vectorize the query
      const embeddingResponse = await this.ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: searchInterfaceQuery,
      });

      if (!embeddingResponse.embeddings || embeddingResponse.embeddings.length === 0) {
        throw new InternalServerErrorException('Failed to generate query embedding from Google API.');
      }

      const queryVector = embeddingResponse.embeddings[0].values;
      const queryVectorString = JSON.stringify(queryVector);

      // Step B: Vector search — top 3 matching listings from MySQL
      const matches: any[] = await this.prisma.$queryRaw`
        SELECT 
          v.listingId, 
          v.textChunk,
          (
            SELECT SUM(CAST(JSON_EXTRACT(v.vectorText, CONCAT('$[', idx, ']')) AS DECIMAL(10,6)) * CAST(JSON_EXTRACT(${queryVectorString}, CONCAT('$[', idx, ']')) AS DECIMAL(10,6)))
            FROM (
              SELECT n AS idx FROM (
                SELECT a.N + b.N * 10 + c.N * 100 AS n
                FROM (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a
                CROSS JOIN (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
                CROSS JOIN (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) c
              ) numbers WHERE n < 768
            ) indexes
          ) AS similarity
        FROM listing_vectors v
        ORDER BY similarity DESC
        LIMIT 3;
      `;

      const listingIds = matches.map((m) => Number(m.listingId));

      // Step B2: Fetch coordinates for the matched listings
      const matchedListings = await this.prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, lat: true, lng: true, area: { select: { name: true } } },
      });

      // Step B3: Fetch live nearby-services data for each matched listing in parallel
      const nearbyServicesPerListing = await Promise.all(
        matchedListings.map(async (listing) => {
          if (!listing.lat || !listing.lng) {
            return { listingId: listing.id, services: 'Location data not available for this listing.' };
          }
          const services = await this.fetchNearbyServices(Number(listing.lat), Number(listing.lng));
          return { listingId: listing.id, services };
        }),
      );

      const servicesByListingId = new Map(
        nearbyServicesPerListing.map((s) => [Number(s.listingId), s.services]),
      );

      // Step B4: Fetch current tenant profiles + compatibility context
      const tenantContextPerListing = await Promise.all(
        listingIds.map(async (listingId) => {
          const [tenantsProfile, compatibility] = await Promise.all([
            this.getListingTenantsProfile(listingId),
            this.getCompatibilitySummary(userId, listingId),
          ]);
          return { listingId, tenantsProfile, compatibility };
        }),
      );

      const tenantContextByListingId = new Map(
        tenantContextPerListing.map((t) => [Number(t.listingId), t]),
      );

      // Step C: Combine text chunks, overpass API services, and user preference analysis
      const extractedContexts = matches
        .map((match) => {
          const services = servicesByListingId.get(Number(match.listingId));
          const tenantInfo = tenantContextByListingId.get(Number(match.listingId));

          return `
            ${match.textChunk}
            Nearby services (live data): ${services ?? 'Not available'}
            Current tenants profile: ${tenantInfo?.tenantsProfile ?? 'Not available'}
            Compatibility with asking student: ${tenantInfo?.compatibility ?? 'Not available'}
          `.trim();
        })
        .join('\n\n---\n\n');

      if (!extractedContexts) {
        return "I couldn't find any student housing options matching your exact parameters right now.";
      }

      // Step D: Format conversation history for SDK chat format
      const sdkHistory = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      // Step E: Create Multi-Turn Chat instance
      const systemInstruction = `
        You are an elite student housing assistant.
        Each listing contains up to four sources of information:
        1. Listing information — price, rooms, location, rules.
        2. Nearby services information — pharmacies, hospitals, universities, restaurants, transport.
        3. Current tenants profile — age, university, and preference keys of students currently living there.
        4. Compatibility with asking student — lifestyle match based on matching preference keys.

        VERY IMPORTANT:
        - Whenever nearby services information exists, ALWAYS mention it, even if not explicitly asked. Include the number of hospitals, pharmacies, universities, restaurants and transport stations if available.
        - Whenever compatibility information exists and shows shared lifestyle attributes (like roommate habits, sleep schedules, hobbies), ALWAYS highlight this explicitly.
        - If a listing has high lifestyle matching, highlight it as an excellent choice for shared communal harmony.
        - If a listing has low compatibility or distinct lifestyle gaps, be transparent about it.
        - Never say information is unavailable unless the context pool specifically states it.

        Answer in Arabic.
      `;

      const chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        history: sdkHistory,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const dynamicPrompt = `
        Context Source Data:
        ${extractedContexts}

        Student Question: "${studentQuery}"
        
        Response requirements:
        - Recommend the apartment.
        - Mention price.
        - Mention location.
        - Mention nearby hospitals.
        - Mention nearby pharmacies.
        - Mention nearby universities.
        - Mention nearby transportation.
        - Mention current tenant compatibility if relevant to the question.

        Answer in Arabic.

        Response:
      `;

      // Step F: Execute pipeline transaction via SDK chat instance
      const generationOutput = await chat.sendMessage({
        message: dynamicPrompt,
      });

      return generationOutput.text || "I'm sorry, I couldn't formulate a proper response.";
    } catch (err) {
      console.error('[MySQL RAG Runtime Error]', err);
      throw new InternalServerErrorException('Error scanning matching data vectors.');
    }
  }

  /**
   * 3. NEARBY SERVICES (Overpass)
   */
  private async fetchNearbyServices(lat: number, lng: number, radiusMeters = 10000): Promise<string> {
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        node["amenity"="university"](around:${radiusMeters},${lat},${lng});
        node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
        node["amenity"="supermarket"](around:${radiusMeters},${lat},${lng});
        node["public_transport"="station"](around:${radiusMeters},${lat},${lng});
        node["railway"="station"](around:${radiusMeters},${lat},${lng});
        node["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});
      );
      out body;
    `;

    try {
      const response = await firstValueFrom(
        this.httpService.post('https://overpass-api.de/api/interpreter', query, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Accept: '*/*',
            'User-Agent': 'Moraafeq/1.0 (contact@moraafeq.local)',
          },
          timeout: 15000,
        }),
      );

      const elements = response.data?.elements ?? [];
      if (elements.length === 0) {
        return 'No notable nearby services found in this area.';
      }

      const counts: Record<string, number> = {};
      const namedPlaces: string[] = [];

      for (const el of elements) {
        const type =
          el.tags?.amenity ||
          el.tags?.public_transport ||
          el.tags?.railway ||
          el.tags?.highway ||
          'other';

        counts[type] = (counts[type] ?? 0) + 1;

        if (el.tags?.name && namedPlaces.length < 10) {
          namedPlaces.push(`${el.tags.name} (${type})`);
        }
      }

      const summaryLines = Object.entries(counts)
        .map(([type, count]) => `${count} ${type}(s)`)
        .join(', ');

      return `
        Nearby services within ${radiusMeters}m: ${summaryLines}.
        Named places include: ${namedPlaces.join(', ') || 'none with names available'}.
      `.trim();
    } catch (err: any) {
      console.error('[Overpass Fetch Error] Message:', err?.message);
      return 'Nearby services data is temporarily unavailable.';
    }
  }

  /**
   * 4. CURRENT TENANTS PROFILE
   * Correctly uses 'guest' and 'preferences' matching your schema names.
   */
  private async getListingTenantsProfile(listingId: number): Promise<string> {
    const tenants = await this.prisma.booking.findMany({
      where: {
        listingId,
        status: 'COMPLETED',
      },
      select: {
        guest: {
          select: {
            id: true,
            firstName: true,
            age: true,
            preferences: {
              select: { preferenceKey: true },
            },
          },
        },
      },
    });

    if (tenants.length === 0) {
      return 'No current tenant information available for this listing.';
    }

    // Deduplicate profiles securely by Guest ID
    const uniqueGuests = Array.from(
      new Map(tenants.map((t) => [t.guest.id, t.guest])).values(),
    );

    const profiles = uniqueGuests.map((g) => {
      const prefs = g.preferences.map((p) => p.preferenceKey).join(', ') || 'none listed';
      return `Tenant (${g.firstName}): age ${g.age ?? 'unknown'}, preferences: [${prefs}]`;
    });

    return profiles.join(' | ');
  }

  /**
   * 5. COMPATIBILITY SUMMARY
   * Correctly checks 'guestId' instead of 'userId' based on your booking schema tracking.
   */
  private async getCompatibilitySummary(
    askingUserId: number,
    listingId: number,
  ): Promise<string> {
    // 1. Get the asking student's own preferences
    const myPreferences = await this.prisma.userPreference.findMany({
      where: { userId: askingUserId },
      select: { preferenceKey: true },
    });
    const myKeys = new Set(myPreferences.map((p) => p.preferenceKey));

    if (myKeys.size === 0) {
      return 'You have not set any preferences yet, so compatibility cannot be calculated.';
    }

    // 2. Get current tenants of this listing, excluding the asking student themself via guestId
    const bookings = await this.prisma.booking.findMany({
      where: {
        listingId,
        status: 'COMPLETED',
        guestId: { not: askingUserId },
      },
      select: {
        guest: {
          select: {
            id: true,
            firstName: true,
            preferences: { select: { preferenceKey: true } },
          },
        },
      },
    });

    if (bookings.length === 0) {
      return 'No current tenants to compare preferences with for this listing.';
    }

    // Deduplicate guests securely
    const uniqueGuests = Array.from(
      new Map(bookings.map((b) => [b.guest.id, b.guest])).values(),
    );

    // 3. Compute overlap percentage
    const comparisons = uniqueGuests.map((g) => {
      const tenantKeys = g.preferences.map((p) => p.preferenceKey);
      const sharedKeys = tenantKeys.filter((k) => myKeys.has(k));
      const overlapPercent = Math.round((sharedKeys.length / myKeys.size) * 100);

      return `With Tenant ${g.firstName}: shares ${sharedKeys.length} preference(s) (${sharedKeys.join(', ') || 'none'}) — ${overlapPercent}% match.`;
    });

    return comparisons.join(' ');
  }
}