import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
import { SearchPlaceDto } from './dto/search-place.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('geocode-address')
  geocodeAddress(@Body() dto: GeocodeAddressDto) {
    return this.locationsService.geocodeAddress(dto);
  }
  @Get('search-place')
searchPlace(@Query() dto: SearchPlaceDto) {
  return this.locationsService.searchPlace(dto);
}
}
