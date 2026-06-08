import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationInsightsService } from './location-insights.service';
import { GenerateLocationInsightDto } from './dto/generate-location-insight.dto';

@Controller('location-insights')
export class LocationInsightsController {
  constructor(
    private readonly locationInsightsService: LocationInsightsService,
  ) {}
  

  // ده endpoint اختياري للتجربة أو للـ admin لاحقًا
  @UseGuards(JwtAuthGuard)
  @Post('listings/:listingId/generate')
  generateForListing(
    @Req() req: any,
    @Param('listingId', ParseIntPipe) listingId: number,
    @Body() dto: GenerateLocationInsightDto,
  ) {
    const userId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.locationInsightsService.generateForListingAutomatically(
      listingId,
      dto?.radiusMeters ?? 1000,
    );
  }

  // ده اللي الـ user هيستخدمه لما يدوس تفاصيل المنطقة
  @Get('listings/:listingId')
  getForListing(@Param('listingId', ParseIntPipe) listingId: number) {
    return this.locationInsightsService.getForListing(listingId);
  }
}