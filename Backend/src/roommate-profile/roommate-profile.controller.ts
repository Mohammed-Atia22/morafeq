import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';

import { RoommateProfileService } from './roommate-profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpsertRoommateProfileDto } from './dto/upsert-roommate-profile.dto';

@Controller('roommate-profile')
@UseGuards(JwtAuthGuard)
export class RoommateProfileController {
  constructor(
    private readonly roommateProfileService: RoommateProfileService,
  ) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.roommateProfileService.getMyProfile(user.id);
  }

  @Put('me')
  upsertMyProfile(
    @CurrentUser() user: any,
    @Body() dto: UpsertRoommateProfileDto,
  ) {
    return this.roommateProfileService.upsertMyProfile(
      user.id,
      dto,
    );
  }
}