import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

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
  datasource: {
    url: env('DIRECT_URL'),
  },
});
