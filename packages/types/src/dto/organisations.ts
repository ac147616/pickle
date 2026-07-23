// POST /organisations - business-lane onboarding (milestone 1.1).
import { z } from 'zod';

import { OrgTypeSchema } from '../enums';

export const CreateOrganisationRequestSchema = z.object({
  name: z.string().min(1).max(200),
  nzbn: z
    .string()
    .regex(/^\d{13}$/, 'NZBN must be 13 digits')
    .optional(),
  type: OrgTypeSchema,
});
export type CreateOrganisationRequest = z.infer<typeof CreateOrganisationRequestSchema>;
