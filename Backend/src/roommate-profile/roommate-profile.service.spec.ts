import { Test, TestingModule } from '@nestjs/testing';
import { RoommateProfileService } from './roommate-profile.service';

describe('RoommateProfileService', () => {
  let service: RoommateProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoommateProfileService],
    }).compile();

    service = module.get<RoommateProfileService>(RoommateProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
