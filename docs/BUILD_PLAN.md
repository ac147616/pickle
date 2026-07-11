# BUILD_PLAN.md — Phased plan for Claude Code sessions

Work strictly in order. One milestone ≈ one focused Claude Code session (or a few).
Each milestone ends with: tests passing, app runs, git commit. Do not start a milestone
with the previous one broken.

## Phase 0 — Foundations
0.1 Scaffold the monorepo (apps/api NestJS, apps/mobile Expo, apps/admin Next.js,
    packages/types). TypeScript strict, ESLint/Prettier, npm workspaces, GitHub Actions
    CI running typecheck + tests on every push.
0.2 Docker-compose for local Postgres(+PostGIS) and Redis. Prisma setup in apps/api
    with the initial schema from PICKLE_SPEC.md §6. First migration. Seed script with
    fake users/trips/shipments for development.
0.3 Firebase Auth integration: mobile sign-in (email + NZ phone OTP), API middleware
    verifying tokens and loading role from Postgres. e2e tests: valid token, invalid
    token, role guard.
0.4 Shared types package: zod schemas + TS types for all core entities and API DTOs,
    imported by api, mobile, and admin.

## Phase 1 — Marketplace core
1.0 Mobile: switch from Expo Go to expo-dev-client + EAS build profiles (dev/preview).
    Implement native NZ phone OTP via @react-native-firebase, replacing the
    email-only Firebase JS SDK auth stubbed in 0.3 (phone OTP was deferred there
    because it needs native modules Expo Go can't run). Prerequisite for 1.1 below:
    both individual shippers and drivers verify via NZ mobile OTP.
1.1 Organisations & onboarding: business lane (NZBN lookup) and individual lane
    (ID doc upload). Verification_documents upload to GCS via signed URLs.
1.2 Admin dashboard v1: login (admin role + 2FA), verification queue with document
    viewer, approve/reject with notes, audit log. Unverified carriers excluded from
    all search results (test this).
1.3 Carrier: vehicles CRUD, trip creation with Google Address Validation + geocoding,
    route polyline from Routes API, recurring trips.
1.4 Shipper: shipment creation — business flow (full dimensions) and individual flow
    (presets mapping to defaults), photos required, prohibited-category enforcement.
1.5 Matching v1: PostGIS corridor query + Routes API detour computation, capacity and
    window checks, ranked results endpoint + mobile search UI. Unit-test the matcher
    with fixture geometries.
1.6 Booking + payments: Stripe Connect (Express) carrier onboarding; booking creation
    captures PaymentIntent; cancellation tiers; webhook handler with signature
    verification; append-only payments tables; nightly reconciliation job.
1.7 Chat: messages scoped to bookings, Firebase delivery channel, system-message
    injection on booking events, composer gating by status, freeze after completion.

## Phase 2 — Delivery experience
2.1 Booking state machine module: transition validation (actor, current state, gates),
    booking_events append, exhaustive unit tests for every legal/illegal transition.
2.2 Driver app: Today screen, per-stop flow (Navigate/Arrive/Scan QR/photos/status
    buttons), geofence checks, Exception + Delay with reason codes.
2.3 Offline queue in the driver app: persist events + POD locally, sync with conflict
    handling, visual "pending sync" state. Test in airplane mode.
2.4 POD capture: photo(s) + signature + recipient name (+ safe-drop photo-only path),
    GPS + timestamp, upload to GCS, pod_records row, gates `delivered`.
2.5 Live tracking: driver location → Firebase per-booking channel (only while active),
    shipper map screen, ~30s throttle.
2.6 Payout release: Cloud Task scheduled at delivered + dispute window; transfer to
    Connect account; payout rows; exception_hold pauses the timer.
2.7 Ratings + dispute case creation (auto-attaches event timeline, chat, POD evidence);
    admin dispute screen with refund/release controls.

## Phase 3 — Hardening (do not skip)
3.1 Authorization sweep: e2e IDOR tests on every endpoint (user A cannot touch user B's
    resources). Rate limiting on auth, search, messaging.
3.2 Document-expiry job (suspend lapsed insurance/licences), notification fan-out
    (push on every status change), Sentry wiring in all three apps, uptime checks.
3.3 Load test the matcher and booking flow; failure-mode tests (Stripe webhook replay,
    duplicate transitions, double-tap payments — idempotency everywhere).
3.4 Staging + prod GCP projects, Cloud Run deploys via Actions, Cloud SQL backups +
    a TESTED restore, Secret Manager, EAS build profiles, store listings.
3.5 Privacy policy + ToS pages, data-retention jobs (location purge), breach runbook.
3.6 Pilot: seed 3–5 friendly Rosebank businesses + 2–3 known carriers; run real freight;
    fix what reality finds before public launch.

## Session hygiene for Claude Code
- Start each session by stating the milestone number; Claude Code will read CLAUDE.md
  automatically and can be pointed at the relevant spec section.
- Ask it to write/run tests as part of every task, not after.
- Review diffs before committing — especially anything touching money, auth, or DTOs.
- Commit at every green checkpoint; small commits make bad changes cheap to revert.
- If it proposes microservices, Kafka, Cassandra, or skipping tests: refuse, cite
  CLAUDE.md.
