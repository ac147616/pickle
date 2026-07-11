// Mirrors apps/api/prisma/schema.prisma's "POD & exceptions" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { ExceptionStatusSchema, ExceptionTypeSchema } from '../enums';

// geog is DB-internal (see AddressSchema's note) - only lat/lng are exposed.
export const PodRecordSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  recipientName: z.string().nullable(),
  signaturePath: z.string().nullable(),
  photoPaths: z.array(z.string()),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  capturedAt: timestampSchema,
  deviceInfo: z.record(z.string(), z.unknown()),
});
export type PodRecord = z.infer<typeof PodRecordSchema>;

export const ExceptionSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  raisedBy: idSchema,
  type: ExceptionTypeSchema,
  description: z.string().nullable(),
  photoPaths: z.array(z.string()),
  status: ExceptionStatusSchema,
  resolvedBy: idSchema.nullable(),
  resolution: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Exception = z.infer<typeof ExceptionSchema>;
