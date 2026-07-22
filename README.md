# Pickle

[![CI](https://github.com/ac147616/pickle/actions/workflows/ci.yml/badge.svg)](https://github.com/ac147616/pickle/actions/workflows/ci.yml)

NZ freight marketplace. See `docs/PICKLE_SPEC.md` for the product/technical spec,
`docs/BUILD_PLAN.md` for the phased build plan, and `CLAUDE.md` for architecture
invariants.

## Prerequisites

- Node.js 22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Postgres + Redis)
- A dev-client build of the mobile app installed on your phone, on the **same WiFi
  network** as your dev machine — see "Mobile" below. The app uses
  `@react-native-firebase`, which needs native modules Expo Go can't run, so plain
  Expo Go no longer works for this project (as of milestone 1.0).

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

First time only (or after a native dependency changes, e.g. adding/upgrading a
`@react-native-firebase/*` package): build and install a dev-client on your phone.
This talks to EAS Build's free tier, so it takes a few minutes.

```bash
cd apps/mobile
npx eas login          # once per machine
npm run build:dev      # builds an APK, prints a download/QR link when done
```

Download the APK link on your Android phone and sideload it (allow "install unknown
apps" for your browser if prompted). You only need to redo this when a *native* module
changes — everyday JS/TS changes hot-reload without a rebuild.

Then, for day-to-day development:

```bash
cd apps/mobile
npm run start:dev-client
```

The dev-client app on your phone connects to this Metro server — either it auto-detects
it on the same WiFi, or open the app and enter `exp://<your-LAN-IP>:8081` manually. The
app itself auto-detects your dev machine's LAN IP from the Metro dev server's own
address (`src/lib/dev-host.ts`) for both the API (`:3000`) and the Firebase emulator
(`:9099`) — you shouldn't need to type in an IP address manually for those.

Sign up with any email/password, or "Sign in with phone instead" with any NZ mobile
number — the Auth emulator generates a verification code instead of sending a real SMS
(fetch it from `http://localhost:9099/emulator/v1/projects/demo-pickle/verificationCodes`
if you're not near the Emulator UI). Either way, the API auto-provisions a matching
`users` row (role `SHIPPER`) on first sign-in. The home screen calls `GET /me` and shows
the result, proving the phone → dev-client → API → Postgres round trip actually works.

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
