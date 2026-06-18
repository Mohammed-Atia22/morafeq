import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReleasePaymentDto } from './dto/release-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ─── Create payment — guest only ───────────

  @Post()
  @UseGuards(JwtAuthGuard)
  createPayment(
    @CurrentUser() user: any,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(user.id, dto);
  }

  // ─── Paymob webhook — no auth ──────────────
  // Paymob calls this — not the user
  // HMAC signature validates it is really Paymob

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Body() body: any,
    @Query('hmac') hmac: string,
  ) {
    return this.paymentsService.handleWebhook(body, hmac);
  }

  // ─── Get my payments — guest ───────────────

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyPayments(@CurrentUser() user: any) {
    return this.paymentsService.getMyPayments(user.id);
  }

  // ─── Get host earnings ─────────────────────

  @Get('earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  getHostEarnings(@CurrentUser() user: any) {
    return this.paymentsService.getHostEarnings(user.id);
  }

  // ─── Get payment by booking ────────────────

  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  getPaymentByBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getPaymentByBooking(bookingId, user.id);
  }

  // ─── Admin: refund payment ─────────────────

  @Patch(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  refundPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, dto);
  }

  @Patch(':id/release')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
releasePayment(
  @Param('id', ParseIntPipe) paymentId: number,
  @Body() dto: ReleasePaymentDto,
) {
  return this.paymentsService.releasePaymentByAdmin(
    paymentId,
    dto,
  );
}
}