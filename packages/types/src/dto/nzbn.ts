// GET /organisations/nzbn/:nzbn - business-lane NZBN lookup (milestone 1.1).
// Backed by a stub NzbnClient until real MBIE/business.govt.nz API access
// exists - see apps/api/src/organisations/nzbn-client.ts.
import { z } from 'zod';

export const NzbnLookupResponseSchema = z.object({
  nzbn: z.string(),
  name: z.string(),
  status: z.string(),
  entityType: z.string(),
});
export type NzbnLookupResponse = z.infer<typeof NzbnLookupResponseSchema>;
