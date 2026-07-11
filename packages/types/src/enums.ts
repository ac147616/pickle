// Mirrors the enums in apps/api/prisma/schema.prisma exactly. Keep in sync
// by hand - see that file for the source of truth and section comments.
import { z } from 'zod';

export const UserRoleSchema = z.enum(['SHIPPER', 'CARRIER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const OrgTypeSchema = z.enum(['SHIPPER', 'CARRIER', 'BOTH']);
export type OrgType = z.infer<typeof OrgTypeSchema>;

export const OrgMemberRoleSchema = z.enum(['OWNER', 'DRIVER', 'STAFF']);
export type OrgMemberRole = z.infer<typeof OrgMemberRoleSchema>;

export const VerificationDocTypeSchema = z.enum(['LICENCE', 'INSURANCE', 'ID', 'REGO']);
export type VerificationDocType = z.infer<typeof VerificationDocTypeSchema>;

export const VerificationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const DriverStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);
export type DriverStatus = z.infer<typeof DriverStatusSchema>;

export const TripStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export type TripStatus = z.infer<typeof TripStatusSchema>;

export const ShipmentStatusSchema = z.enum(['DRAFT', 'LISTED', 'BOOKED', 'COMPLETED', 'CANCELLED']);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

// Exact state machine from PICKLE_SPEC.md §5.
export const BookingStatusSchema = z.enum([
  'BOOKED',
  'DRIVER_EN_ROUTE',
  'ARRIVED_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'ARRIVED_DROPOFF',
  'DELIVERED',
  'COMPLETED',
  'EXCEPTION_HOLD',
  'CANCELLED',
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const ExceptionTypeSchema = z.enum([
  'DAMAGE',
  'MISMATCH',
  'NO_SHOW',
  'OVERSIZE',
  'ACCESS',
  'OTHER',
]);
export type ExceptionType = z.infer<typeof ExceptionTypeSchema>;

export const ExceptionStatusSchema = z.enum(['OPEN', 'RESOLVED']);
export type ExceptionStatus = z.infer<typeof ExceptionStatusSchema>;

export const PaymentStatusSchema = z.enum(['REQUIRES_CAPTURE', 'CAPTURED', 'FAILED', 'REFUNDED']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PayoutStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED']);
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>;

export const RefundStatusSchema = z.enum(['PENDING', 'SUCCEEDED', 'FAILED']);
export type RefundStatus = z.infer<typeof RefundStatusSchema>;

export const DisputeStatusSchema = z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED']);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;
