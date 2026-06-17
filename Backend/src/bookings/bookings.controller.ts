import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RespondBookingDto } from './dto/respond-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @Roles('GUEST', 'ADMIN')
  @UseGuards(RolesGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('my')
  getMyBookings(@CurrentUser() user: any) {
    return this.bookingsService.findGuestBookings(user.id);
  }

  @Get('host')
  @Roles('HOST', 'ADMIN')
  @UseGuards(RolesGuard)
  getHostBookings(
    @CurrentUser() user: any,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.findHostBookings(user.id, status);
  }

  @Get('host/stats')
  @Roles('HOST', 'ADMIN')
  @UseGuards(RolesGuard)
  getHostStats(@CurrentUser() user: any) {
    return this.bookingsService.getHostStats(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.findOne(id, user.id);
  }

  @Patch(':id/respond')
  @Roles('HOST', 'ADMIN')
  @UseGuards(RolesGuard)
  respond(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: RespondBookingDto,
  ) {
    return this.bookingsService.respond(id, user.id, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(id, user.id, dto);
  }

  @Patch(':id/complete')
  @Roles('HOST', 'ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.complete(id, user.id);
  }
}
