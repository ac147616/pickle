import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // The generated client is ESM-native (uses import.meta.url); ts-node's
    // default CJS mode can't load it, so the seed runs via tsx instead.
    seed: 'tsx prisma/seed.ts',
  },
  // prisma migrate/db push/studio use this connection - the Postgres superuser,
  // needed for DDL and to create the shadow DB. The generated PrismaClient at
  // runtime uses schema.prisma's own `url` (DATABASE_URL, the restricted
  // pickle_app role) instead, so these two are deliberately different roles.
  //
  // Deliberately plain process.env access, not prisma/config's env() helper:
  // env() throws if the var is merely unset, even for `prisma generate`
  // (part of this workspace's postinstall hook) which never connects to
  // anything. That's bitten both CI and EAS Build, which npm ci the whole
  // monorepo - including this postinstall - for reasons unrelated to this
  // package. migrate/studio still fail fast, just with Prisma's own
  // connection-string error instead of this file's, when DIRECT_URL is
  // actually needed and missing.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
