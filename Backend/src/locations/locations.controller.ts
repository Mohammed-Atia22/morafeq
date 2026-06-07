import { Body, Controller, Post } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { GeocodeAddressDto } from './dto/geocode-address.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('geocode-address')
  geocodeAddress(@Body() dto: GeocodeAddressDto) {
    return this.locationsService.geocodeAddress(dto);
  }
}
