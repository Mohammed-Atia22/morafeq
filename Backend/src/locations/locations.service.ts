import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
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
          throw new ServiceUnavailableException(
            'Map provider timed out. Please try again or choose the location manually on the map.',
          );
        }

        throw new BadGatewayException(
          'Map provider is currently unavailable. Please try again later.',
        );
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
}
