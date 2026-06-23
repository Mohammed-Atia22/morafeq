import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RagController } from './ai.controller';

const USER_SESSION_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_SESSION_ID = '22222222-2222-4222-8222-222222222222';
const DELETED_SESSION_ID = '33333333-3333-4333-8333-333333333333';

describe('RagController smoke tests', () => {
  let controller: RagController;
  let ragService: any;
  let prisma: any;

  beforeEach(() => {
    ragService = {
      generateRAGResponse: jest.fn().mockResolvedValue('answer'),
      syncListingToVectorDB: jest.fn().mockResolvedValue(undefined),
      rebuildAllApprovedListings: jest.fn().mockResolvedValue({ success: true }),
    };
    prisma = {
      chatSession: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn((input) => input),
      },
      chatMessage: {
        create: jest.fn((input) => input),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };
    controller = new RagController(ragService, prisma);
  });

  it('rejects /rag/ask when sessionId belongs to another user', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: OTHER_SESSION_ID,
      userId: 2,
      isDeleted: false,
      messages: [],
    });

    await expect(
      controller.askHousingAssistant(
        { query: 'عايز سكن' },
        { id: 1 },
        OTHER_SESSION_ID,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects /rag/ask when sessionId is malformed', async () => {
    await expect(
      controller.askHousingAssistant(
        { query: 'عايز سكن' },
        { id: 1 },
        'not-a-uuid',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 instead of reopening a deleted chat session', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: DELETED_SESSION_ID,
      userId: 1,
      isDeleted: true,
      messages: [],
    });

    await expect(
      controller.askHousingAssistant(
        { query: 'كمل المحادثة' },
        { id: 1 },
        DELETED_SESSION_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates new chat sessions for the current user and touches updatedAt', async () => {
    prisma.chatSession.create.mockResolvedValue({
      id: USER_SESSION_ID,
      userId: 1,
      isDeleted: false,
    });

    await controller.askHousingAssistant({ query: 'عايز سكن' }, { id: 1 });

    expect(prisma.chatSession.create).toHaveBeenCalledWith({
      data: { userId: 1 },
    });
    expect(ragService.generateRAGResponse).toHaveBeenCalledWith(
      'عايز سكن',
      [],
      1,
    );
    expect(prisma.$transaction).toHaveBeenCalledWith([
      { data: { sessionId: USER_SESSION_ID, role: 'user', text: 'عايز سكن' } },
      { data: { sessionId: USER_SESSION_ID, role: 'model', text: 'answer' } },
      {
        where: { id: USER_SESSION_ID },
        data: { updatedAt: expect.any(Date) },
      },
    ]);
  });

  it('lists only current user non-deleted sessions ordered by newest update', async () => {
    const newerDate = new Date('2026-06-22T10:00:00.000Z');
    const olderDate = new Date('2026-06-21T10:00:00.000Z');
    prisma.chatSession.findMany.mockResolvedValue([
      {
        id: USER_SESSION_ID,
        updatedAt: newerDate,
        messages: [{ text: 'عايز شقة قريبة من الجامعة بسعر مناسب' }],
      },
      {
        id: OTHER_SESSION_ID,
        updatedAt: olderDate,
        messages: [],
      },
    ]);

    await expect(controller.listSessions({ id: 1 })).resolves.toEqual({
      success: true,
      data: [
        {
          sessionId: USER_SESSION_ID,
          title: 'عايز شقة قريبة من الجامعة بسعر...',
          updatedAt: newerDate,
        },
        {
          sessionId: OTHER_SESSION_ID,
          title: 'محادثة جديدة',
          updatedAt: olderDate,
        },
      ],
    });
    expect(prisma.chatSession.findMany).toHaveBeenCalledWith({
      where: { userId: 1, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  });

  it('soft-deletes the current user session without hard deleting it', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: USER_SESSION_ID,
      userId: 1,
      isDeleted: false,
    });

    await expect(
      controller.deleteSession(USER_SESSION_ID, { id: 1 }),
    ).resolves.toEqual({
      success: true,
      message: 'Chat session deleted.',
    });
    expect(prisma.chatSession.update).toHaveBeenCalledWith({
      where: { id: USER_SESSION_ID },
      data: { isDeleted: true },
    });
  });

  it('returns a current user session with displayable chat messages', async () => {
    const updatedAt = new Date('2026-06-22T11:00:00.000Z');
    const createdAt = new Date('2026-06-22T10:59:00.000Z');
    prisma.chatSession.findUnique.mockResolvedValue({
      id: USER_SESSION_ID,
      userId: 1,
      isDeleted: false,
      updatedAt,
      messages: [
        { id: 'm1', role: 'user', text: 'عايز سكن قريب', createdAt },
        { id: 'm2', role: 'model', text: 'لقيت لك اختيار مناسب', createdAt },
      ],
    });

    await expect(controller.getSession(USER_SESSION_ID, { id: 1 })).resolves.toEqual({
      success: true,
      data: {
        sessionId: USER_SESSION_ID,
        title: 'عايز سكن قريب',
        updatedAt,
        messages: [
          { id: 'm1', role: 'user', text: 'عايز سكن قريب', createdAt },
          {
            id: 'm2',
            role: 'assistant',
            text: 'لقيت لك اختيار مناسب',
            createdAt,
          },
        ],
      },
    });
  });

  it('rejects deleting another user session', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: OTHER_SESSION_ID,
      userId: 2,
      isDeleted: false,
    });

    await expect(
      controller.deleteSession(OTHER_SESSION_ID, { id: 1 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects deleting a malformed session id', async () => {
    await expect(
      controller.deleteSession('not-a-uuid', { id: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('locks admin-only RAG maintenance endpoints with role metadata', () => {
    expect(Reflect.getMetadata('roles', controller.syncListingRecord)).toEqual([
      'ADMIN',
    ]);
    expect(
      Reflect.getMetadata('roles', controller.rebuildAllListingVectors),
    ).toEqual(['ADMIN']);
  });
});
