import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { RoommateMatchingService } from './roommate-matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('roommate-matching')
@UseGuards(JwtAuthGuard)
export class RoommateMatchingController {
  constructor(
    private readonly roommateMatchingService: RoommateMatchingService,
  ) {}

  @Get('listings/:listingId/roommates')
  getListingRoommates(
    @Param('listingId', ParseIntPipe) listingId: number,
    @CurrentUser() user: any,
  ) {
    return this.roommateMatchingService.getListingRoommates(
      listingId,
      user.id,
    );
  }
}