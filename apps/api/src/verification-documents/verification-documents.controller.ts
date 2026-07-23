import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  RequestVerificationDocument,
  RequestVerificationDocumentSchema,
  VerificationDocument,
  VerificationDocumentSchema,
  VerificationDocumentUploadResponse,
  VerificationDocumentUploadResponseSchema,
} from '@pickle/types';

import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { serializeDates } from '../common/serialize-dates';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { VerificationDocumentsService } from './verification-documents.service';

@Controller('verification-documents')
@UseGuards(AuthGuard)
export class VerificationDocumentsController {
  constructor(private readonly documents: VerificationDocumentsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RequestVerificationDocumentSchema))
    body: RequestVerificationDocument,
  ): Promise<VerificationDocumentUploadResponse> {
    const { document, uploadUrl } = await this.documents.createForUser(
      user.id,
      body,
    );
    return VerificationDocumentUploadResponseSchema.parse({
      document: serializeDates(document),
      uploadUrl,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<VerificationDocument> {
    const document = await this.documents.findByIdForUser(id, user.id);
    return VerificationDocumentSchema.parse(serializeDates(document));
  }
}
