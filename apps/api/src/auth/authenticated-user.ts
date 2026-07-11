import { UserRole, UserStatus } from '../generated/prisma/client';

// Deliberately narrow - never the raw Prisma User row (CLAUDE.md §4: no
// endpoint/context ever carries a full user/organisation row further than
// it needs to).
export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}
