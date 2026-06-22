import { ForbiddenException } from '@nestjs/common';
import { RagController } from './ai.controller';

describe('RagController smoke tests', () => {
  let controller: RagController;
  let ragService: any;
  let prisma: any;

  beforeEach(() => {
    ragService = {
      generateRAGResponse: jest.fn().mockResolvedValue('answer'),
    };
    prisma = {
      chatSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      chatMessage: {
        create: jest.fn((input) => input),
      },
      $transaction: jest.fn(),
    };
    controller = new RagController(ragService, prisma);
  });

  it('4. rejects /rag/ask when sessionId belongs to another user', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 2,
      messages: [],
    });

    await expect(
      controller.askHousingAssistant(
        { query: 'عايز سكن' },
        { id: 1 },
        'session-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates new chat sessions for the current user', async () => {
    prisma.chatSession.create.mockResolvedValue({
      id: 'session-1',
      userId: 1,
    });

    await controller.askHousingAssistant({ query: 'عايز سكن' }, { id: 1 });

    expect(prisma.chatSession.create).toHaveBeenCalledWith({
      data: { userId: 1 },
    });
    expect(ragService.generateRAGResponse).toHaveBeenCalledWith('عايز سكن', []);
  });
});
