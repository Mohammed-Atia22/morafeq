import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchListingDto } from '../listings/dto/search-listing.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('listings')
  search(@Query() query: SearchListingDto) {
    return this.searchService.searchListings(query);
  }

  @Get('suggestions')
  async suggestions(
    @Query('q') q?: string,
    @Query('limit') limit = '8',
  ) {
    if (!q?.trim()) {
      return {
        data: [],
        meta: { total: 0, limit: Number(limit) },
      };
    }

    const parsedLimit = Number(limit);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    return this.searchService.searchSuggestions(q.trim(), parsedLimit);
  }
}
