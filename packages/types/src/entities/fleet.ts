// Mirrors apps/api/prisma/schema.prisma's "Fleet & trips" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { TripStatusSchema } from '../enums';

export const VehicleSchema = z.object({
  id: idSchema,
  organisationId: idSchema,
  rego: z.string(),
  makeModel: z.string(),
  bodyType: z.string(),
  maxVolumeM3: z.number(),
  maxWeightKg: z.number(),
  enclosed: z.boolean(),
  insuranceDocId: idSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Vehicle = z.infer<typeof VehicleSchema>;

// geog is DB-internal (derived from lat/lng by trigger, not exposed via
// Prisma) - only lat/lng are part of the wire shape.
export const AddressSchema = z.object({
  id: idSchema,
  formatted: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  placeId: z.string().nullable(),
  validated: z.boolean(),
  notes: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Address = z.infer<typeof AddressSchema>;

export const TripSchema = z.object({
  id: idSchema,
  organisationId: idSchema,
  driverId: idSchema.nullable(),
  vehicleId: idSchema,
  originAddressId: idSchema,
  destinationAddressId: idSchema,
  originLat: z.number().nullable(),
  originLng: z.number().nullable(),
  destinationLat: z.number().nullable(),
  destinationLng: z.number().nullable(),
  departureWindowStart: timestampSchema,
  departureWindowEnd: timestampSchema,
  routePolyline: z.string().nullable(),
  availableVolumeM3: z.number(),
  availableWeightKg: z.number(),
  acceptedCategories: z.array(z.string()),
  status: TripStatusSchema,
  recurrenceRule: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Trip = z.infer<typeof TripSchema>;
