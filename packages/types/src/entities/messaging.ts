// Mirrors apps/api/prisma/schema.prisma's "Messaging" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';

export const MessageSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  senderUserId: idSchema,
  body: z.string(),
  sentAt: timestampSchema,
});
export type Message = z.infer<typeof MessageSchema>;
