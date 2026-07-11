// Mirrors apps/api/prisma/schema.prisma's "Ratings & disputes" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { DisputeStatusSchema } from '../enums';

// ratee is exactly one of an organisation or a user (individual shippers
// have no org) - see PICKLE_SPEC.md §6's note and the migration's CHECK
// constraint. category is a plain string, not an enum - not yet decided
// (see CLAUDE.md: don't pre-invent contracts ahead of the endpoint).
export const RatingSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  raterUserId: idSchema,
  rateeOrgId: idSchema.nullable(),
  rateeUserId: idSchema.nullable(),
  stars: z.number().int(),
  comment: z.string().nullable(),
  createdAt: timestampSchema,
});
export type Rating = z.infer<typeof RatingSchema>;

export const DisputeSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  openedBy: idSchema,
  category: z.string(),
  status: DisputeStatusSchema,
  outcome: z.string().nullable(),
  adminNotes: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Dispute = z.infer<typeof DisputeSchema>;
