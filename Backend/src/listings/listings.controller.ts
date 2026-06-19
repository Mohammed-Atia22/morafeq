import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { SetAmenitiesDto } from './dto/set-amenities.dto';
import { BlockDatesDto } from './dto/block-dates.dto';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReviewsService } from 'src/reviews/reviews.service';
import { QueryReviewsDto } from 'src/reviews/dto/query-reviews.dto';

@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService, private reviewsService: ReviewsService) {}

  // ─── Create listing (HOST only) ───────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.create(user.id, dto);
  }
  
  // ─── Search listings (public) ─────────────
  
  @Get()
  search(@Query() query: SearchListingDto) {
    return this.listingsService.search(query); 
  }
  @Get("All")
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.listingsService.findAll();
  }

  // ─── Get my listings (HOST only) ──────────

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  getMyListings(@CurrentUser() user: any) {
    return this.listingsService.findMyListings(user.id);
  }

  // ─── Get single listing (public) ──────────

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.findOne(id);
  }

  // ─── Update listing ────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, dto);
  }

  // ─── Publish listing ───────────────────────

  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.submit(id, user.id);
  }

  // ─── Delete listing ────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.remove(id, user.id);
  }

  // ─── Upload photos ─────────────────────────

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadPhotos(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.listingsService.uploadPhotos(id, user.id, files);
  }

  // ─── Delete photo ──────────────────────────

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  deletePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.deletePhoto(id, photoId, user.id);
  }

  // ─── Set amenities ─────────────────────────

  @Post(':id/amenities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  setAmenities(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: SetAmenitiesDto,
  ) {
    return this.listingsService.setAmenities(id, user.id, dto);
  }

  // ─── Get availability ──────────────────────

  @Get(':id/availability')
  getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('month') month: string,
  ) {
    return this.listingsService.getAvailability(id, month);
  }

  @Get(':id/rooms')
  getRooms(@Param('id', ParseIntPipe) id: number) {
    return this.listingsService.getRooms(id);
  }

  @Post(':id/rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  createRoom(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CreateRoomDto,
  ) {
    return this.listingsService.createRoom(id, user.id, dto);
  }

  @Patch(':id/rooms/:roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.listingsService.updateRoom(id, roomId, user.id, dto);
  }

  @Delete(':id/rooms/:roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  deleteRoom(
    @Param('id', ParseIntPipe) id: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.deleteRoom(id, roomId, user.id);
  }

  @Post(':id/rooms/:roomId/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadRoomImages(
    @Param('id', ParseIntPipe) id: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.listingsService.uploadRoomImages(id, roomId, user.id, files);
  }

  // ─── Block dates ───────────────────────────

  @Post(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  blockDates(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: BlockDatesDto,
  ) {
    return this.listingsService.blockDates(id, user.id, dto);
  }

  // ─── Unblock dates ─────────────────────────

  @Delete(':id/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  unblockDates(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body('dates') dates: string[],
  ) {
    return this.listingsService.unblockDates(id, user.id, dates);
  }

  // add this endpoint
@Get(':id/reviews')
getListingReviews(
  @Param('id', ParseIntPipe) id: number,
  @Query() query: QueryReviewsDto,
) {
  return this.reviewsService.getListingReviews(id, query);
}
}
