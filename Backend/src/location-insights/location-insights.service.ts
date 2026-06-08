import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  private buildOverpassQuery(lat: number, lng: number, radiusMeters: number) {
    const filters = [
      '["amenity"="pharmacy"]',
      '["shop"~"^(supermarket|convenience)$"]',
      '["amenity"~"^(hospital|clinic)$"]',
      '["amenity"~"^(restaurant|fast_food)$"]',
      '["amenity"="cafe"]',
      '["highway"="bus_stop"]',
      '["public_transport"]',
      '["amenity"~"^(university|college)$"]',
      '["leisure"="fitness_centre"]',
    ];

    const selectors = filters
      .flatMap((filter) => [
        `node(around:${radiusMeters},${lat},${lng})${filter};`,
        `way(around:${radiusMeters},${lat},${lng})${filter};`,
        `relation(around:${radiusMeters},${lat},${lng})${filter};`,
      ])
      .join('\n');

    return `
    [out:json][timeout:25];
    (
      ${selectors}
    );
    out center tags;
  `;
  }

  private countNearbyServices(elements: any[]) {
    const services = {
      pharmacies: 0,
      supermarkets: 0,
      hospitals: 0,
      restaurants: 0,
      cafes: 0,
      transport: 0,
      universities: 0,
      gyms: 0,
    };

    for (const element of elements) {
      const tags = element.tags ?? {};

      if (tags.amenity === 'pharmacy') {
        services.pharmacies++;
      }

      if (tags.shop === 'supermarket' || tags.shop === 'convenience') {
        services.supermarkets++;
      }

      if (tags.amenity === 'hospital' || tags.amenity === 'clinic') {
        services.hospitals++;
      }

      if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') {
        services.restaurants++;
      }

      if (tags.amenity === 'cafe') {
        services.cafes++;
      }

      if (
        tags.highway === 'bus_stop' ||
        tags.public_transport ||
        tags.amenity === 'bus_station'
      ) {
        services.transport++;
      }

      if (tags.amenity === 'university' || tags.amenity === 'college') {
        services.universities++;
      }

      if (tags.leisure === 'fitness_centre' || tags.amenity === 'gym') {
        services.gyms++;
      }
    }

    return services;
  }

  private buildAdvantagesAndDisadvantages(services: {
    pharmacies: number;
    supermarkets: number;
    hospitals: number;
    restaurants: number;
    cafes: number;
    transport: number;
    universities: number;
    gyms: number;
  }) {
    const advantages: string[] = [];
    const disadvantages: string[] = [];

    // Pharmacies
    if (services.pharmacies >= 3) {
      advantages.push('يوجد عدد جيد من الصيدليات القريبة من العقار.');
    } else if (services.pharmacies >= 1) {
      advantages.push('يوجد صيدلية قريبة من العقار.');
    } else {
      disadvantages.push('لا تظهر صيدليات قريبة داخل النطاق المحدد.');
    }

    // Supermarkets
    if (services.supermarkets >= 3) {
      advantages.push('يوجد أكثر من سوبرماركت أو محل قريب للاحتياجات اليومية.');
    } else if (services.supermarkets >= 1) {
      advantages.push('يوجد سوبرماركت أو محل قريب للاحتياجات اليومية.');
    } else {
      disadvantages.push('لا يظهر سوبرماركت قريب داخل النطاق المحدد.');
    }

    // Healthcare
    if (services.hospitals >= 3) {
      advantages.push('يوجد أكثر من خدمة طبية قريبة مثل مستشفى أو عيادة.');
    } else if (services.hospitals >= 1) {
      advantages.push('يوجد خدمة طبية قريبة من العقار.');
    } else {
      disadvantages.push('لا تظهر مستشفى أو عيادة قريبة داخل النطاق المحدد.');
    }

    // Transport
    if (services.transport >= 5) {
      advantages.push('يوجد أكثر من وسيلة مواصلات قريبة من العقار.');
    } else if (services.transport >= 1) {
      advantages.push('يوجد مواصلات قريبة من العقار.');
    } else {
      disadvantages.push('قد يحتاج الساكن للمشي لمسافة أطول للوصول للمواصلات.');
    }

    // Restaurants and cafes
    const foodPlaces = services.restaurants + services.cafes;

    if (foodPlaces >= 5) {
      advantages.push('يوجد عدد جيد من المطاعم والكافيهات القريبة.');
    } else if (foodPlaces >= 1) {
      advantages.push('يوجد مطاعم أو كافيهات قريبة.');
    } else {
      disadvantages.push('لا تظهر مطاعم أو كافيهات كثيرة داخل النطاق المحدد.');
    }

    // Universities / education
    if (services.universities >= 1) {
      advantages.push('يوجد جامعة أو مؤسسة تعليمية قريبة من العقار.');
    }

    // Gyms
    if (services.gyms >= 2) {
      advantages.push('يوجد أكثر من جيم أو مركز رياضي قريب.');
    } else if (services.gyms >= 1) {
      advantages.push('يوجد جيم أو مركز رياضي قريب.');
    }

    return {
      advantages,
      disadvantages,
    };
  }

  private async fetchNearbyServices(
    lat: number,
    lng: number,
    radiusMeters: number,
  ) {
    const query = this.buildOverpassQuery(lat, lng, radiusMeters);

    const body = `data=${encodeURIComponent(query)}`;

    const response = await firstValueFrom(
      this.httpService.post('https://overpass-api.de/api/interpreter', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: '*/*',
          'User-Agent': 'Moraafeq/1.0 (contact@moraafeq.local)',
        },
      }),
    );

    const elements = response.data?.elements ?? [];

    return this.countNearbyServices(elements);
  }

  async generateForListingAutomatically(
    listingId: number,
    radiusMeters = 1000,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        lat: true,
        lng: true,
        title: true,
      },
    });

    if (!listing) {
      return null;
    }

    const lat = Number(listing.lat);
    const lng = Number(listing.lng);

    const nearbyServices = await this.fetchNearbyServices(
      lat,
      lng,
      radiusMeters,
    );

    const { advantages, disadvantages } =
      this.buildAdvantagesAndDisadvantages(nearbyServices);

    return this.prisma.listingLocationInsight.upsert({
      where: {
        listingId: listing.id,
      },
      create: {
        listingId: listing.id,
        provider: 'overpass',
        radiusMeters,
        nearbyServices,
        advantages,
        disadvantages,
        generatedAt: new Date(),
      },
      update: {
        provider: 'overpass',
        radiusMeters,
        nearbyServices,
        advantages,
        disadvantages,
        generatedAt: new Date(),
      },
    });
  }

  async getForListing(listingId: number) {
    const existingInsight = await this.prisma.listingLocationInsight.findUnique(
      {
        where: { listingId },
      },
    );

    if (existingInsight) {
      return {
        message: 'Location insight fetched successfully',
        insight: existingInsight,
      };
    }

    const generatedInsight =
      await this.generateForListingAutomatically(listingId);

    if (!generatedInsight) {
      throw new NotFoundException('Could not generate location insight');
    }

    return {
      message: 'Location insight generated successfully',
      insight: generatedInsight,
    };
  }
}
