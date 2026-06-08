import { Test, TestingModule } from '@nestjs/testing';
import { LocationInsightsService } from './location-insights.service';

describe('LocationInsightsService', () => {
  let service: LocationInsightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationInsightsService],
    }).compile();

    service = module.get<LocationInsightsService>(LocationInsightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
