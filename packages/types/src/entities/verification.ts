// Mirrors apps/api/prisma/schema.prisma's "Verification" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { DriverStatusSchema, VerificationDocTypeSchema, VerificationStatusSchema } from '../enums';

export const VerificationDocumentSchema = z.object({
  id: idSchema,
  ownerUserId: idSchema.nullable(),
  ownerOrgId: idSchema.nullable(),
  docType: VerificationDocTypeSchema,
  storagePath: z.string(),
  status: VerificationStatusSchema,
  reviewedBy: idSchema.nullable(),
  reviewedAt: timestampSchema.nullable(),
  expiresAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type VerificationDocument = z.infer<typeof VerificationDocumentSchema>;

export const DriverSchema = z.object({
  id: idSchema,
  userId: idSchema,
  organisationId: idSchema,
  licenceClass: z.string(),
  licenceExpiry: timestampSchema,
  status: DriverStatusSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Driver = z.infer<typeof DriverSchema>;
