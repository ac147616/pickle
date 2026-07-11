// Mirrors apps/api/prisma/schema.prisma's "Identity & organisations" section.
import { z } from 'zod';

import { idSchema, timestampSchema } from '../common';
import { OrgMemberRoleSchema, OrgTypeSchema, UserRoleSchema, UserStatusSchema } from '../enums';

export const UserSchema = z.object({
  id: idSchema,
  firebaseUid: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  fullName: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type User = z.infer<typeof UserSchema>;

export const OrganisationSchema = z.object({
  id: idSchema,
  name: z.string(),
  nzbn: z.string().nullable(),
  type: OrgTypeSchema,
  verifiedAt: timestampSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type Organisation = z.infer<typeof OrganisationSchema>;

export const OrganisationMemberSchema = z.object({
  id: idSchema,
  organisationId: idSchema,
  userId: idSchema,
  memberRole: OrgMemberRoleSchema,
  createdAt: timestampSchema,
});
export type OrganisationMember = z.infer<typeof OrganisationMemberSchema>;
