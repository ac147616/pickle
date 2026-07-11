// GET /me response - the shipper/carrier/admin's own account summary.
// Shared instead of duplicated ad-hoc between apps/api and apps/mobile.
import { z } from 'zod';

import { idSchema } from '../common';
import { UserRoleSchema, UserStatusSchema } from '../enums';

export const MeResponseSchema = z.object({
  id: idSchema,
  email: z.string().nullable(),
  fullName: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
