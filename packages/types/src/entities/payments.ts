// Mirrors apps/api/prisma/schema.prisma's "Payments" section.
// APPEND-ONLY (CLAUDE.md): integer cents, Stripe ids, idempotency keys.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { PaymentStatusSchema, PayoutStatusSchema, RefundStatusSchema } from '../enums';

export const PaymentSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  amountCents: z.number().int(),
  currency: z.string(),
  stripePaymentIntentId: z.string(),
  status: PaymentStatusSchema,
  idempotencyKey: z.string(),
  createdAt: timestampSchema,
});
export type Payment = z.infer<typeof PaymentSchema>;

export const PayoutSchema = z.object({
  id: idSchema,
  bookingId: idSchema,
  carrierOrgId: idSchema,
  amountCents: z.number().int(),
  currency: z.string(),
  stripeTransferId: z.string().nullable(),
  status: PayoutStatusSchema,
  idempotencyKey: z.string(),
  createdAt: timestampSchema,
});
export type Payout = z.infer<typeof PayoutSchema>;

export const RefundSchema = z.object({
  id: idSchema,
  paymentId: idSchema,
  amountCents: z.number().int(),
  reason: z.string().nullable(),
  stripeRefundId: z.string().nullable(),
  status: RefundStatusSchema,
  idempotencyKey: z.string(),
  createdAt: timestampSchema,
});
export type Refund = z.infer<typeof RefundSchema>;
