// import {
//   Controller,
//   Post,
//   Get,
//   Patch,
//   Body,
//   Param,
//   Query,
//   UseGuards,
//   ParseIntPipe,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { BookingsService } from './bookings.service';
// import { CreateBookingDto } from './dto/create-booking.dto';
// import { RespondBookingDto } from './dto/respond-booking.dto';
// import { CancelBookingDto } from './dto/cancel-booking.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { BookingStatus } from '@prisma/client';

// @Controller('bookings')
// @UseGuards(JwtAuthGuard)
// export class BookingsController {
//   constructor(private bookingsService: BookingsService) {}

//   // ─── Guest creates a booking ───────────────

//   @Post()
//   @Roles('GUEST', 'ADMIN')
//   @UseGuards(RolesGuard)
//   create(
//     @CurrentUser() user: any,
//     @Body() dto: CreateBookingDto,
//   ) {
//     return this.bookingsService.create(user.id, dto);
//   }

//   // ─── Guest views their bookings ────────────

//   @Get('my')
//   getMyBookings(@CurrentUser() user: any) {
//     return this.bookingsService.findGuestBookings(user.id);
//   }

//   // ─── Host views booking requests ──────────

//   @Get('host')
//   @Roles('HOST', 'ADMIN')
//   @UseGuards(RolesGuard)
//   getHostBookings(
//     @CurrentUser() user: any,
//     @Query('status') status?: BookingStatus,
//   ) {
//     return this.bookingsService.findHostBookings(user.id, status);
//   }

//   // ─── Host stats ───────────────────────────

//   @Get('host/stats')
//   @Roles('HOST', 'ADMIN')
//   @UseGuards(RolesGuard)
//   getHostStats(@CurrentUser() user: any) {
//     return this.bookingsService.getHostStats(user.id);
//   }

//   // ─── Get single booking ────────────────────

//   @Get(':id')
//   findOne(
//     @Param('id', ParseIntPipe) id: number,
//     @CurrentUser() user: any,
//   ) {
//     return this.bookingsService.findOne(id, user.id);
//   }

//   // ─── Host responds to booking ──────────────

//   @Patch(':id/respond')
//   @Roles('HOST', 'ADMIN')
//   @UseGuards(RolesGuard)
//   respond(
//     @Param('id', ParseIntPipe) id: number,
//     @CurrentUser() user: any,
//     @Body() dto: RespondBookingDto,
//   ) {
//     return this.bookingsService.respond(id, user.id, dto);
//   }

//   // ─── Cancel booking ────────────────────────

//   @Patch(':id/cancel')
//   @HttpCode(HttpStatus.OK)
//   cancel(
//     @Param('id', ParseIntPipe) id: number,
//     @CurrentUser() user: any,
//     @Body() dto: CancelBookingDto,
//   ) {
//     return this.bookingsService.cancel(id, user.id, dto);
//   }

//   // ─── Host marks booking as completed ──────

//   @Patch(':id/complete')
//   @Roles('HOST', 'ADMIN')
//   @UseGuards(RolesGuard)
//   @HttpCode(HttpStatus.OK)
//   complete(
//     @Param('id', ParseIntPipe) id: number,
//     @CurrentUser() user: any,
//   ) {
//     return this.bookingsService.complete(id, user.id);
//   }
// }