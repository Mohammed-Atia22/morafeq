import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RagService } from './ai.service'; // Ensure this matches your filenames
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AskHousingAssistantDto } from './dto/ask-housing-assistant.dto';

// Simple UUID v4-ish check for the sessionId query param. Avoids letting a
// malformed value reach Prisma's findUnique and surface as an unhandled 500.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint for conversational student searches supporting optional continuous session routing.
   * POST /rag/ask
   * Query parameters: ?sessionId=your-uuid-here
   */
  @Post('ask')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async askHousingAssistant(
    @Body() dto: AskHousingAssistantDto,
    @CurrentUser() user: any,
    @Query('sessionId') sessionId?: string,
  ) {
    let activeSessionId = sessionId;
    let history: { role: 'user' | 'model'; text: string }[] = [];
    const userId = Number(user.id);

    // 1. If a sessionId is specified, validate its shape, then grab past thread lines
    if (activeSessionId) {
      if (!UUID_PATTERN.test(activeSessionId)) {
        throw new BadRequestException('sessionId must be a valid UUID.');
      }

      const session = await this.prisma.chatSession.findUnique({
        where: { id: activeSessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!session || session.isDeleted) {
        throw new NotFoundException(`Chat session with ID ${activeSessionId} not found.`);
      }

      if (session.userId !== userId) {
        throw new ForbiddenException('You do not have access to this chat session.');
      }

      history = session.messages.map((m) => ({
        role: m.role as 'user' | 'model',
        text: m.text,
      }));
    } else {
      // 2. If no sessionId passed, instantiate a new conversational database token
      const newSession = await this.prisma.chatSession.create({
        data: { userId },
      });
      activeSessionId = newSession.id;
    }

    // 3. Process context-aware pipeline calculations
    const aiAnswer = await this.ragService.generateRAGResponse(dto.query, history, userId);

    // 4. Save thread logs into database (atomic operations grouped in transaction)
    await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { sessionId: activeSessionId, role: 'user', text: dto.query },
      }),
      this.prisma.chatMessage.create({
        data: { sessionId: activeSessionId, role: 'model', text: aiAnswer },
      }),
      this.prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      data: {
        sessionId: activeSessionId,
        response: aiAnswer,
      },
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@CurrentUser() user: any) {
    const userId = Number(user.id);

    const sessions = await this.prisma.chatSession.findMany({
      where: { userId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return {
      success: true,
      data: sessions.map((session) => ({
        sessionId: session.id,
        title: this.deriveSessionTitle(session.messages[0]?.text),
        updatedAt: session.updatedAt,
      })),
    };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    if (!UUID_PATTERN.test(sessionId)) {
      throw new BadRequestException('sessionId must be a valid UUID.');
    }

    const userId = Number(user.id);

    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.isDeleted) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found.`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat session.');
    }

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { isDeleted: true },
    });

    return { success: true, message: 'Chat session deleted.' };
  }

  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    if (!UUID_PATTERN.test(sessionId)) {
      throw new BadRequestException('sessionId must be a valid UUID.');
    }

    const userId = Number(user.id);
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session || session.isDeleted) {
      throw new NotFoundException(`Chat session with ID ${sessionId} not found.`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat session.');
    }

    return {
      success: true,
      data: {
        sessionId: session.id,
        title: this.deriveSessionTitle(session.messages[0]?.text),
        updatedAt: session.updatedAt,
        messages: session.messages.map((message) => ({
          id: message.id,
          role: message.role === 'model' ? 'assistant' : 'user',
          text: message.text,
          createdAt: message.createdAt,
        })),
      },
    };
  }

  /**
   * Webhook endpoint to sync or refresh vectors inside MySQL manually for a specific Listing.
   * POST /rag/sync/5
   *
   * NOTE: This triggers a real Gemini embedding API call and writes to the
   * vector store. It must never be reachable by an unauthenticated caller —
   * previously this endpoint had no guard at all. Restricted to admins below;
   * see the TODO if your role enum / guard setup differs.
   */
  @Post('sync/:listingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async syncListingRecord(
    @Param('listingId', ParseIntPipe) listingId: number,
  ) {
    await this.ragService.syncListingToVectorDB(listingId);
    return {
      success: true,
      message: `Listing model ${listingId} has been successfully embedded and indexed inside MySQL.`,
    };
  }

  /**
   * NOTE: This re-embeds EVERY approved listing — one Gemini API call per
   * listing. Previously unauthenticated; now restricted to admins. Same TODO
   * as above regarding the exact role check mechanism.
   */
  @Post('rebuild-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async rebuildAllListingVectors() {
    return this.ragService.rebuildAllApprovedListings();
  }

  private deriveSessionTitle(firstMessageText?: string): string {
    if (!firstMessageText) {
      return 'محادثة جديدة';
    }

    const words = firstMessageText.trim().split(/\s+/);
    return words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
  }
}
