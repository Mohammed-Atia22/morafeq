import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertRoommateProfileDto } from './dto/upsert-roommate-profile.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoommateProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: number) {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    return {
      isCompleted: !!profile,
      profile,
    };
  }

  async upsertMyProfile(userId: number, dto: UpsertRoommateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('User not found or inactive');
    }

    if (user.role !== UserRole.GUEST) {
      throw new ForbiddenException(
        'Only expatriate users can create roommate profiles',
      );
    }

    const cleanedInterests = Array.isArray(dto.interests)
      ? dto.interests
          .map((interest) => interest.trim())
          .filter(Boolean)
          .slice(0, 15)
      : undefined;

    if (
      dto.preferredMinRent !== undefined &&
      dto.preferredMaxRent !== undefined &&
      dto.preferredMinRent > dto.preferredMaxRent
    ) {
      throw new BadRequestException(
        'Minimum rent cannot be greater than maximum rent',
      );
    }

    const profile = await this.prisma.roommateProfile.upsert({
      where: { userId },
      update: {
        occupationType: dto.occupationType,

        university: dto.university?.trim(),
        faculty: dto.faculty?.trim(),
        academicYear: dto.academicYear?.trim(),

        occupation: dto.occupation?.trim(),
        workField: dto.workField?.trim(),

        ageRange: dto.ageRange,
        preferredMinRent: dto.preferredMinRent,
        preferredMaxRent: dto.preferredMaxRent,
        preferredRoomType: dto.preferredRoomType,

        preferredCity: dto.preferredCity?.trim(),
        preferredGovernorate: dto.preferredGovernorate?.trim(),
        interests: cleanedInterests,

        sleepSchedule: dto.sleepSchedule,
        studyFrequency: dto.studyFrequency,

        cleanlinessLevel: dto.cleanlinessLevel,

        smokingStatus: dto.smokingStatus,
        smokingTolerance: dto.smokingTolerance,

        guestPreference: dto.guestPreference,
        privacyLevel: dto.privacyLevel,

        cookingFrequency: dto.cookingFrequency,
        expenseStyle: dto.expenseStyle,
        conflictStyle: dto.conflictStyle,
      },
      create: {
        userId,

        occupationType: dto.occupationType,

        university: dto.university?.trim(),
        faculty: dto.faculty?.trim(),
        academicYear: dto.academicYear?.trim(),

        occupation: dto.occupation?.trim(),
        workField: dto.workField?.trim(),

        ageRange: dto.ageRange,
        preferredMinRent: dto.preferredMinRent,
        preferredMaxRent: dto.preferredMaxRent,
        preferredRoomType: dto.preferredRoomType,

        preferredCity: dto.preferredCity?.trim(),
        preferredGovernorate: dto.preferredGovernorate?.trim(),
        interests: cleanedInterests,

        sleepSchedule: dto.sleepSchedule,
        studyFrequency: dto.studyFrequency,

        cleanlinessLevel: dto.cleanlinessLevel,

        smokingStatus: dto.smokingStatus,
        smokingTolerance: dto.smokingTolerance,

        guestPreference: dto.guestPreference,
        privacyLevel: dto.privacyLevel,

        cookingFrequency: dto.cookingFrequency,
        expenseStyle: dto.expenseStyle,
        conflictStyle: dto.conflictStyle,
      },
    });

    return {
      message: 'Roommate profile saved successfully',
      profile,
    };
  }
}
