import { Test, TestingModule } from '@nestjs/testing';
import { RoommateProfileController } from './roommate-profile.controller';

describe('RoommateProfileController', () => {
  let controller: RoommateProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoommateProfileController],
    }).compile();

    controller = module.get<RoommateProfileController>(RoommateProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
