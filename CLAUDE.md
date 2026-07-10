# CLAUDE.md — Pickle

Pickle is a two-sided freight marketplace for New Zealand: businesses and individuals book
spare space in trucks already making a trip. This is a REAL production app handling REAL
money and strangers' goods. Trust and security beat cleverness and speed, every time.

Full product/technical spec: `docs/PICKLE_SPEC.md` (read it before large tasks).
Phased build plan: `docs/BUILD_PLAN.md`.

## Architecture (do not deviate without discussion)

- **Modular monolith.** One NestJS API. NO microservices, NO Kafka, NO Cassandra, NO
  GraphQL federation, NO event sourcing frameworks. If a task seems to need them, stop
  and ask.
- Monorepo layout:
  - `apps/api` — NestJS + TypeScript, deployed on Cloud Run
  - `apps/mobile` — React Native (Expo) + TypeScript, one app with shipper & driver modes
  - `apps/admin` — Next.js web dashboard (verification queue, disputes, refunds)
  - `packages/types` — shared TypeScript types & zod schemas; single source of truth
- Data: **PostgreSQL (Cloud SQL) + PostGIS** via Prisma. Redis (Memorystore) for live
  driver locations, rate limits, caches only. Firebase Realtime DB as the live-tracking
  and chat delivery channel; Postgres remains the source of truth for all persisted data.
- Async: Cloud Tasks (delayed jobs e.g. payout release) + Pub/Sub (fan-out). No custom
  queue infrastructure.
- Auth: Firebase Auth issues tokens; the API verifies them and loads role/permissions
  from Postgres. Payments: Stripe Connect only.

## Hard invariants (violating these is a bug, full stop)

1. **Money tables are append-only.** Never UPDATE or DELETE rows in payments, payouts,
   refunds. All NZD amounts are integer cents. Every payment mutation uses a Stripe
   idempotency key. Verify Stripe webhook signatures. This is enforced at the DB level,
   not just by convention: the API connects as a restricted `pickle_app` role that has
   UPDATE/DELETE revoked on payments/payouts/refunds/booking_events (see
   `docker/postgres-init/01-app-role.sh`). Migrations run as a separate, more privileged
   role (`prisma.config.ts`'s `DIRECT_URL`, vs. the app's `DATABASE_URL`) — table owners
   and superusers bypass GRANT/REVOKE, so this split is what makes the REVOKE mean
   anything. Preserve this role separation in every environment, including Cloud SQL in
   prod (distinct migrator vs. runtime service accounts).
2. **Booking status is a strict state machine** enforced server-side (see spec §5).
   Clients request transitions; the API validates actor, current state, and gate
   conditions (geofence, QR scan, POD) before applying. Never trust client-asserted state.
3. **booking_events is immutable and append-only.** Every status change, scan, photo,
   exception, delay gets an event row with actor_user_id, occurred_at, GPS, metadata.
   Same DB-level enforcement as payments/payouts/refunds above.
4. **Progressive disclosure of PII** (spec §7). Contact details, exact addresses are
   NEVER in listing/search responses. Exact addresses only after booking is paid, only
   to the counterparty. Response DTOs are shaped per role + booking status. No endpoint
   ever returns raw user/organisation rows.
5. **Authorization on every resource access.** A user can only read/write their own
   bookings/shipments/trips. Write tests for cross-tenant access (IDOR) on every new
   endpoint — a 403 test is mandatory, not optional.
6. **All input validated** with zod/class-validator at the API boundary. Prisma only —
   no raw SQL string interpolation. Files go to private GCS buckets, served via
   short-lived signed URLs only.
7. **Secrets** come from environment/Secret Manager. Never hardcode keys, never commit
   .env, never log tokens, card data, or full addresses.
8. **Offline tolerance in the driver app:** status events and POD captures queue locally
   (with device timestamp + GPS) and sync when connectivity returns. Rural NZ has dead
   zones; this is a launch requirement, not a nice-to-have.

## Conventions

- TypeScript strict mode everywhere. No `any` without a comment justifying it.
- Tests: unit tests for the state machine, money math, and matching logic; e2e (supertest)
  for auth + authorization on every endpoint. Run `npm test` before declaring a task done.
- Migrations via Prisma Migrate. Never edit a committed migration; add a new one.
- API style: REST, plural nouns, kebab-case routes (`/bookings/:id/events`).
- Errors: typed error responses `{ code, message }`; never leak stack traces or SQL.
- Commits: conventional commits (`feat:`, `fix:`, `chore:`). Small, reviewable diffs.
- UI: Pickle brand — deep green (#0E3524), cream (#FAF7EC), rounded cards, friendly but
  calm tone. Driver screens optimise for big tap targets, one-handed use, sunlight.
- When a product decision is ambiguous, ASK rather than invent. When a security decision
  is ambiguous, take the more conservative option and flag it.

## Definition of done for any task

Code compiles with no TS errors → tests written and passing → authorization test included
for new endpoints → migration included if schema changed → brief note in the PR/summary of
what was built and any decisions made.
