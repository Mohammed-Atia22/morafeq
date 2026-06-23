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
  Post,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApproveListingDto } from './dto/approve-listing.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { AdminQueryListingsDto } from './dto/query-listings.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminQueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminQueryDisputesDto } from './dto/query-disputes.dto';
import { QueryDisputeMessagesDto } from './dto/query-dispute-messages.dto';
import { OpenDisputeConversationDto } from './dto/open-dispute-conversation.dto';
import { SendDisputeMessageDto } from './dto/send-dispute-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  @Get('complaints')
  getComplaints() {
    return this.adminService.getComplaints();
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

  @Patch('listings/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspendListing(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.unsuspendListing(id);
  }

  @Delete('listings/:id')
  @HttpCode(HttpStatus.OK)
  deleteListing(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteListing(id);
  }

  // ─── Users ────────────────────────────────

  @Get('users')
  getUsers(@Query() query: AdminQueryUsersDto) {
    return this.adminService.getUsers(query);
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

  // ─── Get disputes ────────────────────────────

@Get('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') 
getDisputes(
  @Query() query: AdminQueryDisputesDto,
) {
  return this.adminService.getDisputes(query);
}


@Get('disputes/:bookingId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
getDisputeDetail(
  @Param('bookingId', ParseIntPipe) bookingId: number,
) {
  return this.adminService.getDisputeDetail(bookingId);
}

// ─── Get original dispute conversation ───────

@Get('disputes/:bookingId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
getDisputeMessages(
  @Param('bookingId', ParseIntPipe) bookingId: number,
  @Query() query: QueryDisputeMessagesDto,
) {
  return this.adminService.getDisputeMessages(
    bookingId,
    query,
  );
}

// ─── Open private dispute conversation ───────

@Post('disputes/:bookingId/conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
openDisputeConversation(
  @Param('bookingId', ParseIntPipe) bookingId: number,
  @Body() dto: OpenDisputeConversationDto,
) {
  return this.adminService.openDisputeConversation(
    bookingId,
    dto,
  );
}

// ─── Get private dispute conversation messages ───

@Get('dispute-conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
getPrivateDisputeConversationMessages(
  @Param('conversationId', ParseIntPipe)
  conversationId: number,

  @Query()
  query: QueryDisputeMessagesDto,
) {
  return this.adminService.getPrivateDisputeConversationMessages(
    conversationId,
    query,
  );
}

// ─── Send private dispute message ────────────

@Post('dispute-conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
sendPrivateDisputeMessage(
  @Param('conversationId', ParseIntPipe)
  conversationId: number,

  @CurrentUser() admin: any,

  @Body()
  dto: SendDisputeMessageDto,
) {
  return this.adminService.sendPrivateDisputeMessage(
    conversationId,
    admin.id,
    dto,
  );
}

// ─── Close private dispute conversation ─────

@Patch('dispute-conversations/:conversationId/close')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
closeDisputeConversation(
  @Param('conversationId', ParseIntPipe)
  conversationId: number,
) {
  return this.adminService.closeDisputeConversation(
    conversationId,
  );
}
}
