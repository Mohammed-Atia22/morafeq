import { Test, TestingModule } from '@nestjs/testing';
import { RoommateMatchingController } from './roommate-matching.controller';

describe('RoommateMatchingController', () => {
  let controller: RoommateMatchingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoommateMatchingController],
    }).compile();

    controller = module.get<RoommateMatchingController>(RoommateMatchingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
