import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BookingStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoommateMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async getListingRoommates(listingId: number, currentUserId: number) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
        isActive: true,
        roommateProfile: true,
      },
    });

    if (!currentUser || !currentUser.isActive) {
      throw new BadRequestException('User not found or inactive');
    }

    if (currentUser.role !== UserRole.GUEST) {
      throw new BadRequestException(
        'Only guest users can check roommate compatibility',
      );
    }

    if (!currentUser.roommateProfile) {
      throw new BadRequestException('Complete your roommate profile first');
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        city: true,
        governorate: true,
        monthlyRent: true,
        depositAmount: true,
        roomType: true,
        propertyType: true,
        genderPreference: true,
        smokingPolicy: true,
        photos: {
          select: {
            id: true,
            url: true,
            isCover: true,
          },
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
          take: 3,
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        listingId,
        guestId: {
          not: currentUserId,
        },
        status: {
          in: [BookingStatus.CHECK_IN_PENDING, BookingStatus.COMPLETED],
        },
      },
      select: {
        id: true,
        status: true,
        selectedRoomName: true,
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            avatarUrl: true,
            trustScore: true,
            verificationStatus: true,
            roommateProfile: true,
          },
        },
      },
    });

    const uniqueGuests = new Map<number, any>();

    for (const booking of bookings) {
      if (
        booking.guest.roommateProfile &&
        !uniqueGuests.has(booking.guest.id)
      ) {
        uniqueGuests.set(booking.guest.id, booking);
      }
    }

    const roommates = Array.from(uniqueGuests.values()).map((booking) => {
      const compatibility = this.calculateCompatibility(
        currentUser.roommateProfile,
        booking.guest.roommateProfile,
      );

      return {
        bookingId: booking.id,
        bookingStatus: booking.status,
        selectedRoomName: booking.selectedRoomName,

        user: {
          id: booking.guest.id,
          displayName: `${booking.guest.firstName} ${booking.guest.lastName?.[0] ?? ''}.`,
          firstName: booking.guest.firstName,
          lastNameInitial: booking.guest.lastName?.[0] ?? null,
          age: booking.guest.age,
          avatarUrl: booking.guest.avatarUrl,
          trustScore: booking.guest.trustScore,
          verificationStatus: booking.guest.verificationStatus,

          university: booking.guest.roommateProfile.university,
          faculty: booking.guest.roommateProfile.faculty,
          academicYear: booking.guest.roommateProfile.academicYear,
          ageRange: booking.guest.roommateProfile.ageRange,
          interests: this.toStringArray(
            booking.guest.roommateProfile.interests,
          ),
        },

        compatibility,
      };
    });

    roommates.sort((a, b) => b.compatibility.score - a.compatibility.score);

    const listingCompatibility = this.calculateListingCompatibility(
      listing,
      currentUser.roommateProfile,
      roommates,
    );

    return {
      listing,
      listingCompatibility,
      roommates,
      meta: {
        totalRoommates: roommates.length,
      },
    };
  }

  private calculateListingCompatibility(
    listing: any,
    currentProfile: any,
    roommates: Array<{
      compatibility: { score: number };
    }>,
  ) {
    const propertyCompatibility = this.calculatePropertyCompatibility(
      listing,
      currentProfile,
    );

    if (roommates.length === 0) {
      return {
        score: propertyCompatibility.score,
        level: this.getLevel(propertyCompatibility.score),
        summary: `الشقة دي مناسبة لك بنسبة ${propertyCompatibility.score}% بناءً على السعر، نوع الغرفة، الموقع، وسياسة التدخين. لا يوجد زملاء مؤكدين في السكن حتى الآن.`,

        propertyScore: propertyCompatibility.score,
        roommatesAverageScore: null,

        positiveReasons: propertyCompatibility.positiveReasons,
        warnings: propertyCompatibility.warnings,

        topMatchReasons: propertyCompatibility.positiveReasons.slice(0, 3),
        topWarnings: propertyCompatibility.warnings.slice(0, 2),
      };
    }

    const roommatesAverageScore = Math.round(
      roommates.reduce(
        (sum, roommate) => sum + roommate.compatibility.score,
        0,
      ) / roommates.length,
    );

    const finalScore = Math.round(
      propertyCompatibility.score * 0.5 + roommatesAverageScore * 0.5,
    );

    return {
      score: finalScore,
      level: this.getLevel(finalScore),
      summary:
        finalScore >= 80
          ? `الشقة دي مناسبة لك بنسبة ${finalScore}% بناءً على مواصفات الشقة وتوافقك مع الزملاء الحاليين.`
          : `نسبة توافقك مع هذه الشقة هي ${finalScore}% بناءً على مواصفات الشقة والزملاء الحاليين.`,

      propertyScore: propertyCompatibility.score,
      roommatesAverageScore,

      positiveReasons: propertyCompatibility.positiveReasons,
      warnings: propertyCompatibility.warnings,

      topMatchReasons: propertyCompatibility.positiveReasons.slice(0, 3),
      topWarnings: propertyCompatibility.warnings.slice(0, 2),
    };
  }

  private calculatePropertyCompatibility(listing: any, profile: any) {
    let score = 50;

    const positiveReasons: string[] = [];
    const warnings: string[] = [];

    // 1. Rent compatibility
    if (
      profile.preferredMinRent !== null &&
      profile.preferredMinRent !== undefined &&
      profile.preferredMaxRent !== null &&
      profile.preferredMaxRent !== undefined
    ) {
      const rent = listing.monthlyRent;

      if (
        rent >= profile.preferredMinRent &&
        rent <= profile.preferredMaxRent
      ) {
        score += 25;
        positiveReasons.push('الإيجار داخل الميزانية المناسبة لك');
      } else if (rent > profile.preferredMaxRent) {
        score -= 20;
        warnings.push('الإيجار أعلى من الميزانية التي تفضلها');
      } else if (rent < profile.preferredMinRent) {
        score += 5;
        positiveReasons.push('الإيجار أقل من الحد المتوقع لميزانيتك');
      }
    }

    // 2. Room type compatibility
    if (profile.preferredRoomType && listing.roomType) {
      if (profile.preferredRoomType === listing.roomType) {
        score += 20;
        positiveReasons.push('نوع الغرفة مناسب لتفضيلاتك');
      } else {
        score -= 10;
        warnings.push('نوع الغرفة مختلف عن تفضيلك');
      }
    }

    // 3. City compatibility
    if (profile.preferredCity && listing.city) {
      if (this.sameLocationText(profile.preferredCity, listing.city)) {
        score += 15;
        positiveReasons.push('الشقة في المدينة التي تفضلها');
      } else {
        score -= 10;
        warnings.push('الشقة في مدينة مختلفة عن تفضيلك');
      }
    }

    // 4. Governorate compatibility
    if (profile.preferredGovernorate && listing.governorate) {
      if (
        this.sameLocationText(profile.preferredGovernorate, listing.governorate)
      ) {
        score += 10;
        positiveReasons.push('الشقة في المحافظة المناسبة لك');
      } else {
        score -= 5;
        warnings.push('المحافظة مختلفة عن تفضيلك');
      }
    }

    // 5. Smoking policy compatibility
    if (
      profile.smokingTolerance === 'NEVER' &&
      listing.smokingPolicy === 'ALLOWED'
    ) {
      score -= 20;
      warnings.push('سياسة التدخين في الشقة قد لا تناسبك');
    }

    if (
      profile.smokingTolerance === 'NEVER' &&
      listing.smokingPolicy === 'NOT_ALLOWED'
    ) {
      score += 15;
      positiveReasons.push('الشقة تمنع التدخين وهذا مناسب لك');
    }

    return {
      score: this.clamp(score),
      positiveReasons,
      warnings,
    };
  }

  private calculateCompatibility(currentProfile: any, roommateProfile: any) {
    const positiveReasons: string[] = [];
    const warnings: string[] = [];

    const academic = this.calculateAcademicScore(
      currentProfile,
      roommateProfile,
      positiveReasons,
      warnings,
    );

    const lifestyle = this.calculateLifestyleScore(
      currentProfile,
      roommateProfile,
      positiveReasons,
      warnings,
    );

    const cleanliness = this.calculateCleanlinessScore(
      currentProfile,
      roommateProfile,
      positiveReasons,
      warnings,
    );

    const social = this.calculateSocialScore(
      currentProfile,
      roommateProfile,
      positiveReasons,
      warnings,
    );

    const smoking = this.calculateSmokingScore(
      currentProfile,
      roommateProfile,
      positiveReasons,
      warnings,
    );

    const interests = this.calculateInterestsScore(
      currentProfile,
      roommateProfile,
      positiveReasons,
    );

    const score = Math.round(
      academic * 0.3 +
        lifestyle * 0.2 +
        cleanliness * 0.2 +
        social * 0.15 +
        smoking * 0.1 +
        interests * 0.05,
    );

    return {
      score,
      level: this.getLevel(score),
      breakdown: {
        academic,
        lifestyle,
        cleanliness,
        social,
        smoking,
        interests,
      },
      positiveReasons,
      warnings,

      topMatchReasons: positiveReasons.slice(0, 4),
      topWarnings: warnings.slice(0, 2),
    };
  }

  private calculateAcademicScore(
    a: any,
    b: any,
    positiveReasons: string[],
    warnings: string[],
  ) {
    let score = 0;

    const sameUniversity = this.sameText(a.university, b.university);

    const sameFaculty = this.sameText(a.faculty, b.faculty);

    const sameAcademicYear = this.sameText(a.academicYear, b.academicYear);

    if (sameUniversity) {
      score += 35;
      positiveReasons.push('نفس الجامعة');
    } else if (a.university && b.university) {
      score += 10;
      warnings.push('الجامعة مختلفة');
    } else {
      score += 15;
    }

    if (sameFaculty) {
      score += 45;
      positiveReasons.push('نفس الكلية');
    } else if (a.faculty && b.faculty) {
      score += 10;
      warnings.push('الكلية مختلفة');
    } else {
      score += 15;
    }

    if (sameAcademicYear) {
      score += 20;
      positiveReasons.push('نفس السنة الدراسية');
    } else if (a.academicYear && b.academicYear) {
      score += 8;
    } else {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private calculateLifestyleScore(
    a: any,
    b: any,
    positiveReasons: string[],
    warnings: string[],
  ) {
    let score = 50;

    if (a.sleepSchedule && b.sleepSchedule) {
      if (a.sleepSchedule === b.sleepSchedule) {
        score += 30;
        positiveReasons.push('مواعيد النوم متقاربة');
      } else {
        score -= 15;
        warnings.push('اختلاف في مواعيد النوم');
      }
    }

    if (a.studyFrequency && b.studyFrequency) {
      if (a.studyFrequency === b.studyFrequency) {
        score += 20;
        positiveReasons.push('نمط الدراسة داخل السكن متقارب');
      } else {
        score -= 5;
      }
    }

    return this.clamp(score);
  }

  private calculateCleanlinessScore(
    a: any,
    b: any,
    positiveReasons: string[],
    warnings: string[],
  ) {
    const values: Record<string, number> = {
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2,
      VERY_HIGH: 3,
    };

    if (!a.cleanlinessLevel || !b.cleanlinessLevel) {
      return 50;
    }

    const diff = Math.abs(
      values[a.cleanlinessLevel] - values[b.cleanlinessLevel],
    );

    if (diff === 0) {
      positiveReasons.push('نفس مستوى النظافة');
      return 100;
    }

    if (diff === 1) {
      warnings.push('اختلاف بسيط في مستوى النظافة');
      return 75;
    }

    warnings.push('اختلاف واضح في مستوى النظافة');
    return 40;
  }

  private calculateSocialScore(
    a: any,
    b: any,
    positiveReasons: string[],
    warnings: string[],
  ) {
    let score = 50;

    if (a.guestPreference && b.guestPreference) {
      if (a.guestPreference === b.guestPreference) {
        score += 25;
        positiveReasons.push('سياسة الضيوف متوافقة');
      } else {
        score -= 15;
        warnings.push('اختلاف في سياسة الضيوف');
      }
    }

    if (a.privacyLevel && b.privacyLevel) {
      if (a.privacyLevel === b.privacyLevel) {
        score += 15;
        positiveReasons.push('مستوى الخصوصية متقارب');
      } else {
        score -= 5;
      }
    }

    if (a.expenseStyle && b.expenseStyle) {
      if (a.expenseStyle === b.expenseStyle) {
        score += 10;
        positiveReasons.push('طريقة تقسيم المصاريف متوافقة');
      }
    }

    return this.clamp(score);
  }

  private calculateSmokingScore(
    a: any,
    b: any,
    positiveReasons: string[],
    warnings: string[],
  ) {
    if (a.smokingTolerance === 'NEVER' && b.smokingStatus !== 'NON_SMOKER') {
      warnings.push('تعارض مهم في التدخين');
      return 0;
    }

    if (b.smokingTolerance === 'NEVER' && a.smokingStatus !== 'NON_SMOKER') {
      warnings.push('الطرف الآخر لا يقبل التدخين');
      return 0;
    }

    if (a.smokingStatus === 'NON_SMOKER' && b.smokingStatus === 'NON_SMOKER') {
      positiveReasons.push('الاتنين غير مدخنين');
      return 100;
    }

    if (a.smokingTolerance === 'OK' || b.smokingTolerance === 'OK') {
      return 80;
    }

    return 60;
  }

  private calculateInterestsScore(a: any, b: any, positiveReasons: string[]) {
    const aInterests = this.toStringArray(a.interests);
    const bInterests = this.toStringArray(b.interests);

    if (aInterests.length === 0 || bInterests.length === 0) {
      return 50;
    }

    const aSet = new Set(aInterests.map((x) => x.toLowerCase()));

    const bSet = new Set(bInterests.map((x) => x.toLowerCase()));

    const common = [...aSet].filter((x) => bSet.has(x));

    if (common.length > 0) {
      positiveReasons.push(`اهتمامات مشتركة: ${common.join(', ')}`);
    }

    const union = new Set([...aSet, ...bSet]);

    return Math.round((common.length / union.size) * 100);
  }

  private getLevel(score: number) {
    if (score >= 90) return 'EXCELLENT_MATCH';
    if (score >= 80) return 'STRONG_MATCH';
    if (score >= 65) return 'GOOD_MATCH';
    if (score >= 50) return 'MODERATE_MATCH';
    return 'LOW_MATCH';
  }

  private sameText(a?: string | null, b?: string | null) {
    if (!a || !b) return false;

    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }


private sameLocationText(
  a?: string | null,
  b?: string | null,
) {
  if (!a || !b) return false;

  return (
    this.normalizeLocationText(a) ===
    this.normalizeLocationText(b)
  );
}

private normalizeLocationText(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/governorate/g, '')
    .replace(/محافظة/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const map: Record<string, string> = {
    alexandria: 'alexandria',
    الاسكندرية: 'alexandria',
    الإسكندرية: 'alexandria',

    cairo: 'cairo',
    القاهره: 'cairo',
    القاهرة: 'cairo',

    giza: 'giza',
    الجيزه: 'giza',
    الجيزة: 'giza',
  };

  return map[normalized] ?? normalized;
}
  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private clamp(value: number) {
    return Math.max(0, Math.min(100, value));
  }
}
