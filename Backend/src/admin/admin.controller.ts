import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApproveListingDto } from './dto/approve-listing.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { AdminQueryListingsDto } from './dto/query-listings.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Dashboard stats ───────────────────────

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ─── Listings ──────────────────────────────

  @Get('listings')
  getListings(@Query() query: AdminQueryListingsDto) {
    return this.adminService.getListings(query);
  }

  @Get('listings/:id')
  getListingDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getListingDetail(id);
  }

  @Patch('listings/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveListing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveListingDto,
  ) {
    return this.adminService.approveListing(id, dto);
  }

  @Patch('listings/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectListing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectListingDto,
  ) {
    return this.adminService.rejectListing(id, dto);
  }

  @Patch('listings/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspendListing(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendListing(id, reason);
  }

  // ─── Users ────────────────────────────────

  @Get('users')
  getUsers(
    @Query('page')  page?:  number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getUsers(page, limit);
  }

  @Patch('users/:id')
  @HttpCode(HttpStatus.OK)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deactivateUser(id);
  }
}