import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getFavorites(@CurrentUser() user: any) {
    return this.favoritesService.getFavorites(user.id);
  }

  @Get('status')
  getStatuses(
    @CurrentUser() user: any,
    @Query('listingIds') listingIds: string,
  ) {
    return this.favoritesService.getStatuses(user.id, listingIds);
  }

  @Get(':listingId/status')
  getStatus(
    @CurrentUser() user: any,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.favoritesService.getStatus(user.id, listingId);
  }

  @Post(':listingId')
  @HttpCode(HttpStatus.CREATED)
  addFavorite(
    @CurrentUser() user: any,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.favoritesService.addFavorite(user.id, listingId);
  }

  @Delete(':listingId')
  @HttpCode(HttpStatus.OK)
  removeFavorite(
    @CurrentUser() user: any,
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    return this.favoritesService.removeFavorite(user.id, listingId);
  }
}
