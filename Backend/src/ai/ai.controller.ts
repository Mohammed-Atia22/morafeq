import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RagService } from './ai.service'; // Ensure this matches your filenames
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

      if (!session) {
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
   *
   * NOTE: This triggers a real Gemini embedding API call and writes to the
   * vector store. It must never be reachable by an unauthenticated caller —
   * previously this endpoint had no guard at all. Restricted to admins below;
   * see the TODO if your role enum / guard setup differs.
   */
  @Post('sync/:listingId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncListingRecord(
    @Param('listingId', ParseIntPipe) listingId: number,
    @CurrentUser() user: any,
  ) {
    // TODO: confirm the exact admin role value used in your UserRole enum.
    // This assumes 'ADMIN'; adjust if your project uses a different name
    // (e.g. 'HOST_ADMIN') or a RolesGuard/@Roles() decorator instead.
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can trigger listing re-sync.');
    }

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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async rebuildAllListingVectors(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can trigger a full rebuild.');
    }

    return this.ragService.rebuildAllApprovedListings();
  }
}