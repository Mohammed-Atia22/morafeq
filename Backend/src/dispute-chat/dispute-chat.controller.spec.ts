import { Test, TestingModule } from '@nestjs/testing';
import { DisputeChatController } from './dispute-chat.controller';

describe('DisputeChatController', () => {
  let controller: DisputeChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputeChatController],
    }).compile();

    controller = module.get<DisputeChatController>(DisputeChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
