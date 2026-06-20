// import { Controller, Post, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
// import { RagService } from './ai.service';

// @Controller('rag')
// export class RagController {
//   constructor(private readonly ragService: RagService) {}

//   /**
//    * Endpoint for conversational student searches.
//    * POST /rag/ask
//    */
//   @Post('ask')
//   @HttpCode(HttpStatus.OK)
//   async askHousingAssistant(@Body('query') query: string) {
//     const aiAnswer = await this.ragService.generateRAGResponse(query);
//     return {
//       success: true,
//       data: {
//         response: aiAnswer,
//       },
//     };
//   }

//   /**
//    * Webhook endpoint to sync or refresh vectors inside MySQL manually for a specific Listing.
//    * POST /rag/sync/5
//    */
//   @Post('sync/:listingId')
//   @HttpCode(HttpStatus.OK)
//   async syncListingRecord(@Param('listingId', ParseIntPipe) listingId: number) {
//     await this.ragService.syncListingToVectorDB(listingId);
//     return {
//       success: true,
//       message: `Listing model ${listingId} has been successfully embedded and indexed inside MySQL.`,
//     };
//   }
// }