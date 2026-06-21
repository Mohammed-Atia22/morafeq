import { Test, TestingModule } from '@nestjs/testing';
import { RoommateMatchingService } from './roommate-matching.service';

describe('RoommateMatchingService', () => {
  let service: RoommateMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoommateMatchingService],
    }).compile();

    service = module.get<RoommateMatchingService>(RoommateMatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
