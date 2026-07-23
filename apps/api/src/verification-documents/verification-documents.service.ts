import { randomUUID } from 'crypto';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestVerificationDocument, UploadContentType } from '@pickle/types';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const EXTENSION_BY_CONTENT_TYPE: Record<UploadContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

@Injectable()
export class VerificationDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Owner is always the caller - request never carries an ownerId, so
  // there's no field to spoof to create a document under someone else.
  async createForUser(userId: string, request: RequestVerificationDocument) {
    const extension = EXTENSION_BY_CONTENT_TYPE[request.contentType];
    const objectPath = `verification-documents/user/${userId}/${randomUUID()}.${extension}`;

    const { uploadUrl, storagePath } = await this.storage.getSignedUploadUrl(
      objectPath,
      request.contentType,
    );

    const document = await this.prisma.verificationDocument.create({
      data: {
        ownerUserId: userId,
        docType: request.docType,
        storagePath,
      },
    });

    return { document, uploadUrl };
  }

  async findByIdForUser(id: string, userId: string) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id },
    });
    if (!document) {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      });
    }
    // CLAUDE.md: cross-tenant access must 403, not leak someone else's
    // document under a valid id.
    if (document.ownerUserId !== userId) {
      throw new ForbiddenException({
        code: 'DOCUMENT_FORBIDDEN',
        message: 'Not your document',
      });
    }
    return document;
  }
}
