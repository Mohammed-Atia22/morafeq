import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // ─── Create review ─────────────────────────
  // Both GUEST and HOST can create reviews

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, dto);
  }

  // ─── Check if I can review a booking ───────

  @Get('can-review/:bookingId')
  @UseGuards(JwtAuthGuard)
  canReview(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.canReview(bookingId, user.id);
  }

  // ─── Reviews I wrote ───────────────────────

  @Get('my/written')
  @UseGuards(JwtAuthGuard)
  getMyWrittenReviews(@CurrentUser() user: any) {
    return this.reviewsService.getMyWrittenReviews(user.id);
  }

  // ─── Reviews I received ────────────────────

  @Get('my/received')
  @UseGuards(JwtAuthGuard)
  getMyReceivedReviews(@CurrentUser() user: any) {
    return this.reviewsService.getMyReceivedReviews(user.id);
  }

  // ─── Reviews about a host (public) ─────────

  @Get('host/:hostId')
  getHostReviews(
    @Param('hostId', ParseIntPipe) hostId: number,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getHostReviews(hostId, query);
  }

  // ─── Reviews about a guest (semi-public) ───

  @Get('guest/:guestId')
  @UseGuards(JwtAuthGuard)
  getGuestReviews(
    @Param('guestId', ParseIntPipe) guestId: number,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getGuestReviews(guestId, query);
  }

  // ─── Delete review ─────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.remove(id, user.id);
  }

  // ─── Admin: toggle visibility ──────────────

  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  toggleVisibility(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.toggleVisibility(id);
  }
}