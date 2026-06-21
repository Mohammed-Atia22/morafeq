import { Test, TestingModule } from '@nestjs/testing';
import { DisputeChatService } from './dispute-chat.service';

describe('DisputeChatService', () => {
  let service: DisputeChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisputeChatService],
    }).compile();

    service = module.get<DisputeChatService>(DisputeChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
