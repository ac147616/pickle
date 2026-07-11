# Pickle

NZ freight marketplace. See `docs/PICKLE_SPEC.md` for the product/technical spec,
`docs/BUILD_PLAN.md` for the phased build plan, and `CLAUDE.md` for architecture
invariants.

## Prerequisites

- Node.js 22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Postgres + Redis)
- Expo Go on your phone, on the **same WiFi network** as your dev machine (App Store /
  Play Store) — for testing the mobile app on a real device instead of a simulator

## First-time setup

```bash
npm install

cp .env.example .env
cp apps/api/.env.example apps/api/.env

npm run db:up               # Postgres+PostGIS and Redis containers
cd apps/api
npx prisma migrate deploy   # applies the committed migrations
npx prisma db seed          # optional: fake users/trips/shipments for dev
cd ../..
```

## Running everything

You'll want four terminals.

**1. Database (if not already up)**

```bash
npm run db:up
```

**2. Firebase Auth emulator** (dev/test auth backend — no real Firebase project needed)

```bash
npm run emulators
```

Emulator UI: http://localhost:4000

**3. API**

```bash
cd apps/api
npm run start:dev
```

Boots on `http://localhost:3000`. Confirms it can reach Postgres (`[PrismaService]
Connected to database`) and picks up `FIREBASE_AUTH_EMULATOR_HOST` from `apps/api/.env`
automatically — no real Firebase credentials involved.

**4. Mobile**

```bash
cd apps/mobile
npm run start
```

Scan the QR code with Expo Go on your phone. The app auto-detects your dev machine's
LAN IP from the Metro dev server's own address (`src/lib/dev-host.ts`) and uses it for
both the API (`:3000`) and the Firebase emulator (`:9099`) — you shouldn't need to type
in an IP address manually.

Sign up with any email/password on the phone; the API auto-provisions a matching
`users` row (role `SHIPPER`) on first sign-in. The home screen calls `GET /me` and shows
the result, proving the phone → Expo Go → API → Postgres round trip actually works.
Phone-number sign-in is a "coming soon" stub for now — see `docs/BUILD_PLAN.md`
milestone 1.0.

### If your phone can't reach the API or emulator

- Confirm your phone and PC are on the same WiFi network (not a guest network that
  isolates devices from each other).
- Windows Firewall may prompt to allow Node.js/Metro through on first run — allow it for
  private networks.
- If auto-detection picks the wrong network interface (e.g. you have a VPN active), set
  `EXPO_PUBLIC_DEV_HOST` in `apps/mobile/.env` to your PC's actual LAN IP
  (`ipconfig` on Windows, look for the WiFi adapter's IPv4 address).

## Tests

```bash
npm run typecheck   # no services needed
npm run lint        # no services needed
npm run test        # unit tests, no services needed
npm run test:e2e    # spins up the Firebase emulator itself; needs Postgres running (npm run db:up) first
```

## Stopping

```bash
npm run db:down   # stops Postgres/Redis (data persists in a named volume)
```
