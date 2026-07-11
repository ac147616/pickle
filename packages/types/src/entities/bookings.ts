// Mirrors apps/api/prisma/schema.prisma's "Bookings & events" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { BookingStatusSchema } from '../enums';

export const BookingSchema = z.object({
  id: idSchema,
  shipmentId: idSchema,
  tripId: idSchema,
  quotedPriceCents: z.number().int(),
  platformFeeCents: z.number().int(),
  carrierPayoutCents: z.number().int(),
  status: BookingStatusSchema,
  pickupQrToken: z.string(),
  deliveryCode: z.string(),
  cancelledBy: idSchema.nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Booking = z.infer<typeof BookingSchema>;

// APPEND-ONLY (CLAUDE.md): every status change, scan, photo, exception,
// delay gets a row. eventType is a plain string, not an enum - the set of
// event types grows freely as new gate/status-change kinds are added.
// geog is DB-internal (see AddressSchema's note) - only lat/lng are exposed.
export const BookingEventSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  eventType: z.string(),
  actorUserId: idSchema.nullable(),
  occurredAt: timestampSchema,
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});
export type BookingEvent = z.infer<typeof BookingEventSchema>;
