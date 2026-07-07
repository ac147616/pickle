import { z } from 'zod';

// Placeholder to prove cross-package TS resolution works end to end.
// Real entity schemas (users, trips, shipments, bookings, ...) land in milestone 0.4
// per docs/BUILD_PLAN.md.
export const pickleMonorepoSchema = z.object({
  scaffolded: z.literal(true),
});

export type PickleMonorepo = z.infer<typeof pickleMonorepoSchema>;
