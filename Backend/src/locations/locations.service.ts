import {
  BadGatewayException,
  BadRequestException,
  NotFoundException ,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
import { SearchPlaceDto } from './dto/search-place.dto';
import { isAxiosError } from 'axios';


interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: Record<string, string>;
}

@Injectable()
export class LocationsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async geocodeAddress(dto: GeocodeAddressDto) {
    const baseUrl =
      this.configService.get<string>('NOMINATIM_BASE_URL') ??
      'https://nominatim.openstreetmap.org';

    const appName = this.configService.get<string>('APP_NAME') ?? 'Moraafeq';

    const contactEmail =
      this.configService.get<string>('APP_CONTACT_EMAIL') ??
      'no-reply@example.com';

    const country = dto.country ?? 'Egypt';

    const userAgent = `${appName}/1.0 (${contactEmail})`;

    const freeFormQueries = [
  // 1. نبدأ بالمنطقة لأن ده الأهم لفتح الخريطة قريب
  [dto.areaName, dto.city, country],
  [dto.areaName, dto.governorate, country],

  // 2. بعد كده المدينة كـ fallback
  [dto.city, dto.governorate, country],
  [dto.city, country],

  // 3. الشارع نخليه بعد المنطقة، مش قبلها
  [dto.streetName, dto.areaName, dto.city, country],

  // 4. آخر حاجة العنوان الكامل
  [
    dto.buildingNumber,
    dto.streetName,
    dto.nearbyLandmark,
    dto.areaName,
    dto.city,
    dto.governorate,
    country,
  ],
]
  .map((parts) => parts.filter(Boolean).join(', '))
  .filter((query, index, arr) => query && arr.indexOf(query) === index);

    for (const query of freeFormQueries) {
      const result = await this.searchNominatim(baseUrl, userAgent, {
        q: query,
        format: 'jsonv2',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'eg',
        'accept-language': 'ar,en',
      });

      if (result) {
        return this.formatNominatimResult(result, query);
      }
    }

    const structuredSearches = [
  {
    city: dto.areaName ?? dto.city,
    state: dto.governorate,
    country,
  },
  {
    city: dto.city,
    state: dto.governorate,
    country,
  },
];

    for (const params of structuredSearches) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => Boolean(value)),
      );

      const result = await this.searchNominatim(baseUrl, userAgent, {
        ...cleanParams,
        format: 'jsonv2',
        addressdetails: 1,
        limit: 1,
        countrycodes: 'eg',
        'accept-language': 'ar,en',
      });

      if (result) {
        return this.formatNominatimResult(result, JSON.stringify(cleanParams));
      }
    }

    const approximateLocation = this.getApproximateEgyptLocation(dto);

    if (approximateLocation) {
      return approximateLocation;
    }

    throw new BadRequestException(
      'Could not find a location for this address. Try adding a clearer city, area, or landmark.',
    );
  }

  private async searchNominatim(
    baseUrl: string,
    userAgent: string,
    params: Record<string, any>,
  ): Promise<NominatimSearchResult | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<NominatimSearchResult[]>(`${baseUrl}/search`, {
          params,
          headers: {
            'User-Agent': userAgent,
          },
        }),
      );

      const results = response.data;

      if (!results || results.length === 0) {
        return null;
      }

      return results[0];
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return null;
        }

        return null;
      }

      throw error;
    }
  }

  private formatNominatimResult(result: NominatimSearchResult, query: string) {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new BadGatewayException(
        'Invalid coordinates returned from map provider',
      );
    }

    const type = result.type;

    let matchLevel: 'STREET' | 'AREA' | 'CITY' | 'UNKNOWN' = 'UNKNOWN';

    if (type === 'road' || result.address?.road) {
      matchLevel = 'STREET';
    } else if (
      type === 'neighbourhood' ||
      result.address?.neighbourhood ||
      result.address?.suburb
    ) {
      matchLevel = 'AREA';
    } else if (result.address?.city || result.address?.town) {
      matchLevel = 'CITY';
    }

    return {
      provider: 'nominatim',
      query,
      matchLevel,
      lat,
      lng,
      formattedAddress: result.display_name,
      placeId: String(result.place_id),
      raw: {
        class: result.class,
        type: result.type,
        importance: result.importance,
        address: result.address,
      },
    };
  }


  async searchPlace(dto: SearchPlaceDto) {
  const country = dto.country ?? 'Egypt';

  const rawQueries = [
    [dto.q, dto.city, dto.governorate, country],
    [dto.q, dto.city, country],
    [dto.q, country],
    [dto.q],
  ];

  // aliases بسيطة للأماكن المشهورة
  // دي مفيدة لأن Nominatim ساعات بيلاقي الإنجليزي ومش بيلاقي العربي
  const normalizedQ = dto.q.trim();

  if (
    normalizedQ.includes('كلية تجارة') ||
    normalizedQ.includes('كلية التجارة')
  ) {
    rawQueries.push(
      ['Faculty of Commerce Alexandria University', dto.city, country],
      ['Faculty of Commerce, Alexandria University', country],
      ['Alexandria University Faculty of Commerce', country],
    );
  }

  if (
    normalizedQ.includes('جامعة الإسكندرية') ||
    normalizedQ.includes('جامعة الاسكندرية')
  ) {
    rawQueries.push(
      ['Alexandria University', dto.city, country],
      ['Alexandria University', country],
    );
  }

  const queries = rawQueries
    .map((parts) => parts.filter(Boolean).join(', '))
    .filter((query, index, arr) => query && arr.indexOf(query) === index);

  for (const query of queries) {
    const response = await firstValueFrom(
      this.httpService.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'eg',
        },
        headers: {
          'User-Agent': 'Moraafeq/1.0 (contact@moraafeq.local)',
        },
      }),
    );

    const results = response.data ?? [];

    if (results.length > 0) {
      const places = results.map((place: any) => ({
        name: place.name || place.display_name?.split(',')[0],
        formattedAddress: place.display_name,
        lat: Number(place.lat),
        lng: Number(place.lon),
        placeId: String(place.place_id),
        type: place.type,
        class: place.class,
        importance: place.importance,
        searchedQuery: query,
      }));

      return {
        message: 'Places fetched successfully',
        originalQuery: dto.q,
        usedQuery: query,
        places,
      };
    }
  }

  throw new NotFoundException('No places found for this search');
}

private getApproximateEgyptLocation(dto: GeocodeAddressDto) {
    const cityKey = this.normalizeLocationText(
      `${dto.areaName ?? ''} ${dto.city} ${dto.governorate}`,
    );

    const knownLocations = [
      {
        keys: ['cairo', 'القاهرة', 'new cairo', 'التجمع', 'nasr city', 'مدينة نصر'],
        lat: 30.0444,
        lng: 31.2357,
        name: 'القاهرة، مصر',
      },
      {
        keys: ['giza', 'الجيزة', 'dokki', 'الدقي', 'mohandessin', 'المهندسين'],
        lat: 30.0131,
        lng: 31.2089,
        name: 'الجيزة، مصر',
      },
      {
        keys: ['alexandria', 'alex', 'الإسكندرية', 'اسكندرية', 'سموحة', 'smouha'],
        lat: 31.2001,
        lng: 29.9187,
        name: 'الإسكندرية، مصر',
      },
      {
        keys: ['mansoura', 'المنصورة', 'dakahlia', 'الدقهلية'],
        lat: 31.0409,
        lng: 31.3785,
        name: 'المنصورة، مصر',
      },
      {
        keys: ['tanta', 'طنطا', 'gharbia', 'الغربية'],
        lat: 30.7865,
        lng: 31.0004,
        name: 'طنطا، مصر',
      },
      {
        keys: ['zagazig', 'الزقازيق', 'sharqia', 'الشرقية'],
        lat: 30.5877,
        lng: 31.502,
        name: 'الزقازيق، مصر',
      },
      {
        keys: ['ismailia', 'الإسماعيلية', 'اسماعيلية'],
        lat: 30.5965,
        lng: 32.2715,
        name: 'الإسماعيلية، مصر',
      },
      {
        keys: ['port said', 'بورسعيد'],
        lat: 31.2653,
        lng: 32.3019,
        name: 'بورسعيد، مصر',
      },
      {
        keys: ['suez', 'السويس'],
        lat: 29.9668,
        lng: 32.5498,
        name: 'السويس، مصر',
      },
      {
        keys: ['assiut', 'asyut', 'أسيوط', 'اسيوط'],
        lat: 27.1809,
        lng: 31.1837,
        name: 'أسيوط، مصر',
      },
      {
        keys: ['luxor', 'الأقصر', 'الاقصر'],
        lat: 25.6872,
        lng: 32.6396,
        name: 'الأقصر، مصر',
      },
      {
        keys: ['aswan', 'أسوان', 'اسوان'],
        lat: 24.0889,
        lng: 32.8998,
        name: 'أسوان، مصر',
      },
    ];

    const match = knownLocations.find((location) =>
      location.keys.some((key) =>
        cityKey.includes(this.normalizeLocationText(key)),
      ),
    );

    if (!match) {
      return null;
    }

    return {
      provider: 'local-fallback',
      query: [dto.streetName, dto.areaName, dto.city, dto.governorate, dto.country ?? 'Egypt']
        .filter(Boolean)
        .join(', '),
      matchLevel: 'CITY',
      lat: match.lat,
      lng: match.lng,
      formattedAddress: `${match.name} - موقع تقريبي، حرّك العلامة لتحديد العقار بدقة`,
      placeId: `local-${match.lat}-${match.lng}`,
      raw: {
        fallback: true,
      },
    };
  }

  private normalizeLocationText(value: string) {
    return value
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
