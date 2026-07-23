// POST /verification-documents, GET /verification-documents/:id - individual
// lane document upload (milestone 1.1). Owner is always the caller, never
// client-supplied - see apps/api/src/verification-documents.
import { z } from 'zod';

import { VerificationDocumentSchema } from '../entities/verification';
import { VerificationDocTypeSchema } from '../enums';

const uploadContentTypeSchema = z.enum(['image/jpeg', 'image/png', 'application/pdf']);
export type UploadContentType = z.infer<typeof uploadContentTypeSchema>;

export const RequestVerificationDocumentSchema = z.object({
  docType: VerificationDocTypeSchema,
  contentType: uploadContentTypeSchema,
});
export type RequestVerificationDocument = z.infer<typeof RequestVerificationDocumentSchema>;

export const VerificationDocumentUploadResponseSchema = z.object({
  document: VerificationDocumentSchema,
  uploadUrl: z.url(),
});
export type VerificationDocumentUploadResponse = z.infer<
  typeof VerificationDocumentUploadResponseSchema
>;
