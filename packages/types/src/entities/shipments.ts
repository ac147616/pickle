// Mirrors apps/api/prisma/schema.prisma's "Shipments" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { ShipmentStatusSchema } from '../enums';

export const ShipmentSchema = z.object({
  id: idSchema,
  shipperOrgId: idSchema.nullable(),
  shipperUserId: idSchema.nullable(),
  pickupAddressId: idSchema,
  dropoffAddressId: idSchema,
  readyFrom: timestampSchema,
  deliverBy: timestampSchema,
  declaredValueCents: z.number().int(),
  notes: z.string().nullable(),
  status: ShipmentStatusSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Shipment = z.infer<typeof ShipmentSchema>;

// cargoCategory/packagingType are plain strings, not enums - the category
// list is admin-configurable (PICKLE_SPEC.md §9), not a fixed taxonomy.
export const ShipmentItemSchema = z.object({
  id: idSchema,
  shipmentId: idSchema,
  cargoCategory: z.string(),
  packagingType: z.string(),
  qty: z.number().int(),
  weightKg: z.number(),
  lengthCm: z.number(),
  widthCm: z.number(),
  heightCm: z.number(),
  photos: z.array(z.string()),
  createdAt: timestampSchema,
});
export type ShipmentItem = z.infer<typeof ShipmentItemSchema>;
