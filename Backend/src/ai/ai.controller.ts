import {
  Controller,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { RagService } from './ai.service'; // Ensure this matches your filenames
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async askHousingAssistant(
    @CurrentUser() user: any,
    @Body('query') query: string,
    @Query('sessionId') sessionId?: string,
  ) {
    let activeSessionId = sessionId;
    let history: { role: 'user' | 'model'; text: string }[] = [];

    // 1. If a sessionId is specified, grab past thread lines
    if (activeSessionId) {
      const session = await this.prisma.chatSession.findUnique({
        where: { id: activeSessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!session) {
        throw new NotFoundException(`Chat session with ID ${activeSessionId} not found.`);
      }

      history = session.messages.map((m) => ({
        role: m.role as 'user' | 'model',
        text: m.text,
      }));
    } else {
      // 2. If no sessionId passed, instantiate a new conversational database token
      const newSession = await this.prisma.chatSession.create({ data: {} });
      activeSessionId = newSession.id;
    }

    // 3. Process context-aware pipeline calculations — now passes the authenticated user's id
    const aiAnswer = await this.ragService.generateRAGResponse(
      query,
      user.id,
      history,
    );

    // 4. Save thread logs into database (atomic operations grouped in transaction)
    await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { sessionId: activeSessionId, role: 'user', text: query },
      }),
      this.prisma.chatMessage.create({
        data: { sessionId: activeSessionId, role: 'model', text: aiAnswer },
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

  /**
   * Webhook endpoint to sync or refresh vectors inside MySQL manually for a specific Listing.
   * POST /rag/sync/5
   */
  @Post('sync/:listingId')
  @HttpCode(HttpStatus.OK)
  async syncListingRecord(@Param('listingId', ParseIntPipe) listingId: number) {
    await this.ragService.syncListingToVectorDB(listingId);
    return {
      success: true,
      message: `Listing model ${listingId} has been successfully embedded and indexed inside MySQL.`,
    };
  }
}