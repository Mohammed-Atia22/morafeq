import { Test, TestingModule } from '@nestjs/testing';
import { LocationInsightsController } from './location-insights.controller';

describe('LocationInsightsController', () => {
  let controller: LocationInsightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationInsightsController],
    }).compile();

    controller = module.get<LocationInsightsController>(LocationInsightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
