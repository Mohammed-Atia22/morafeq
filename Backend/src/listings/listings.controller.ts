// import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
// import { ListingsService } from './listings.service';
// import { CreateListingDto } from './dto/create-listing.dto';
// import { UpdateListingDto } from './dto/update-listing.dto';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// @Controller('listings')
// export class ListingsController {
//   constructor(private readonly listingsService: ListingsService) {}


//   @Post()
//   @UseGuards(JwtAuthGuard)
//   create(@Req() req: Req, @Body() dto: CreateListingDto) {
//     return this.listingsService.create(req.user.subid, dto);
//   }

//   @Get()
//   findAll() {
//     return this.listingsService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.listingsService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
//     return this.listingsService.update(+id, updateListingDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.listingsService.remove(+id);
//   }
// }


import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateListingDto) {
    return this.listingsService.create(req.user.id, dto);
  }
}