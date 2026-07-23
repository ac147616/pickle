// GET /me response - the shipper/carrier/admin's own account summary.
// Shared instead of duplicated ad-hoc between apps/api and apps/mobile.
import { z } from 'zod';

import { idSchema } from '../common';
import { UserRoleSchema, UserStatusSchema } from '../enums';

export const MeResponseSchema = z.object({
  id: idSchema,
  email: z.string().nullable(),
  phone: z.string().nullable(),
  fullName: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  // True until the user has either joined/created an organisation (business
  // lane) or submitted a verification document (individual lane) - drives
  // apps/mobile's (onboarding) route group gate. See BUILD_PLAN.md 1.1.
  needsOnboarding: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
