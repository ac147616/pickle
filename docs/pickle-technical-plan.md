# Pickle — Technical & Product Plan
### A production-grade plan for a two-sided freight capacity marketplace (NZ)

---

## 1. What we are building, precisely

Pickle is a marketplace, not a courier company. That distinction drives every technical decision. You never touch the freight; you broker trust between two strangers — a shipper handing over goods and money, and a carrier handing over space in their truck and their reputation. The product therefore has three jobs, in priority order:

1. **Trust infrastructure** — verification, escrow, proof of delivery, dispute handling. If this fails once publicly, the marketplace dies.
2. **Matching** — connecting a shipment (origin, destination, size, time) with a trip that passes close enough to both ends with enough spare capacity.
3. **Logistics UX** — booking, tracking, handover, and payment flows that a small bakery owner and a 55-year-old owner-driver can both use without training.

Three user roles, one codebase:

- **Shipper** (business or individual): creates shipments, books space, pays, tracks, confirms delivery, rates.
- **Carrier / Driver**: lists trips and capacity, accepts bookings, runs the pickup → transit → delivery workflow (this is where the NZ Post patterns live), gets paid.
- **Platform admin** (you, initially): verification approvals, dispute resolution, refunds, monitoring. A web dashboard, not an app.

Note: in small transport companies the carrier account owner and the driver are often the same person. Model them separately (an organisation has drivers) but make the solo-operator path frictionless — one signup creates both.

---

## 2. Lessons taken from the NZ Post Field app

| NZ Post pattern | What it is there | Pickle adaptation |
|---|---|---|
| Product Type + Container Type dropdowns | Controlled vocabulary for what's being moved and how it's packaged | **Cargo category** (ambient food, dry goods, furniture, equipment…) + **packaging type** (box, satchel, pallet, crate, drum) + qty + weight + volume, all captured at booking time. No free-text-only cargo descriptions — structured data is what makes disputes resolvable and matching accurate. |
| Origin/Destination as location + time window | Depot legs with scheduled windows | Trips are legs with pickup/drop-off **windows**, not exact times. Shippers book against a window; this absorbs real-world traffic slippage without every job being "late". |
| Driver menu: Load / Unload / Exception / Delay / Order Info / POD | Complete operational state machine | The driver app is a **task list with exactly these verbs**. Exception and Delay are first-class, one-tap actions with reason codes — never something a driver has to phone you about. |
| Proof of Delivery as a dedicated flow | Signature capture at handover | POD = photo + recipient name + signature + GPS coordinates + timestamp, all server-recorded. This is the event that releases escrowed money, so it must be tamper-evident. |
| Dangerous Goods as an explicit category | Regulated freight class | **Explicitly prohibited at launch** (declared at booking, in the ToS, and enforced by category list). DG carriage in NZ requires certified drivers and documentation under Land Transport Rule: Dangerous Goods 2005 — a liability you must not absorb accidentally. Same for restricted items: alcohol, weapons, livestock, cash. |
| Barcode scanning of shipments | Label-based tracking | No printed labels, but generate a **QR code per booking**. Driver scans the shipper's QR at pickup and the recipient's (or a delivery code) at drop-off. This binds the physical handover to the digital record and prevents "I gave it to someone in a truck" ambiguity. |

---

## 3. Feature plan

### 3.1 MVP (launchable, trust-complete)

**Onboarding & verification**
- Email/phone signup with OTP verification; NZ mobile number required for drivers.
- Shipper businesses: NZBN lookup (free MBIE API) to verify the entity; individuals allowed with ID verification.
- Carriers: driver licence photo (front/back), vehicle rego plate (validated against NZTA public rego check where possible), proof of insurance (goods-in-transit / carrier's liability policy document upload), Stripe Connect onboarding which itself performs KYC and bank verification.
- Nothing is bookable until verification is admin-approved. This is manual at first — that's fine and actually a selling point ("every carrier is vetted").

**Carrier: trips & capacity**
- Create a trip: origin, destination, optional via-points, departure window, vehicle, available volume (m³), available weight (kg), accepted cargo categories, whether goods are enclosed/weatherproof, price expectations (or accept platform pricing).
- Recurring trips (e.g., "Auckland → Hamilton every Tue/Thu") — huge for owner-drivers with regular runs.

**Shipper: shipments & booking**
- Create a shipment: pickup address, drop-off address, cargo category, packaging type, qty, dimensions or volume, weight, declared value, photos of the goods, ready-from time, deliver-by time, special notes.
- Search returns matching trips with price, carrier rating, vehicle type, and ETA windows. Book → pay → both parties get confirmed details and a masked chat channel.

**Matching (v1 — deliberately simple)**
- Geospatial corridor matching: a shipment matches a trip if pickup and drop-off are within a detour tolerance (e.g., adds ≤ X km / Y minutes to the route, computed via Google Routes API), the time windows overlap, capacity fits, and cargo category is accepted.
- This is PostGIS queries + one Routes API call per candidate, not machine learning. Do not build "AI route optimisation" for launch; the pitch-deck promise is honoured by good corridor matching, and real optimisation only matters once trips carry multiple bookings.

**Driver workflow (the NZ Post-inspired core)**
- Today screen: assigned pickups and drop-offs in route order.
- Per booking: **Navigate → Arrive (geofenced) → Scan QR → Photograph goods loaded → Picked Up → In Transit → Arrive → Scan/enter delivery code → POD (photo + signature + name) → Delivered.**
- **Exception** (damaged on inspection, doesn't match description, oversize, nobody present) and **Delay** (with reason + new ETA) available at every stage. Exceptions pause the money flow and notify the shipper immediately.

**Tracking & notifications**
- Live driver location shared with the shipper only while their booking is active (picked up → delivered), throttled to ~30s updates. Push notifications on every status change.

**Payments (Stripe Connect)**
- Shipper pays full amount at booking (card; add-ons later). Funds are captured but **carrier payout is held until POD + a 24–48h dispute window**, then transferred to the carrier's Stripe Connect account minus your 7% + platform fee. Refund paths for cancellation tiers and upheld disputes.
- You never store card data; Stripe handles PCI scope.

**Ratings, disputes, support**
- Two-way ratings after completion. Dispute button opens a case with the booking's full evidence trail (photos, timestamps, GPS, chat) attached automatically — this is why structured events matter.
- In-app masked chat (no phone numbers exchanged until booking is confirmed, ideally never).

**Admin dashboard (web)**
- Verification queue, live bookings map, dispute cases, refunds/payout controls, user suspension, category/pricing configuration.

### 3.2 Phase 2 (post-launch, revenue-informed)

- Multi-booking trip optimisation (this is where route optimisation genuinely earns the "AI" label — sequencing several pickups/drop-offs per trip).
- Dynamic pricing suggestions from historical lane data.
- Declared-value insurance offering via an insurance partner (do not self-insure).
- Shipper web portal + CSV/API for businesses with regular volume.
- Carrier fleet features: multiple drivers per organisation, dispatcher view.
- Address book, saved cargo profiles, scheduled/recurring shipments.
- Xero integration for invoices (very NZ-SMB-friendly).

---

## 4. Architecture & tech stack

### 4.1 The honest architectural advice

The Tenet-style "microservices with Kafka, Cassandra, and an API gateway" architecture is wrong for you. That is Uber-at-scale architecture; adopted at your stage it multiplies the ways your app can break and the surface you must secure, with zero user-visible benefit at 5,000 bookings/year (~14/day). A production-grade app is not one with the most components — it's one where every component is monitored, backed up, and understood by its two-person team.

**Build a well-structured modular monolith on managed infrastructure.** Modules (auth, shipments, trips, matching, payments, tracking, notifications) live in one deployable service with clean internal boundaries, so you *can* extract a service later if one module needs independent scaling. Managed services mean Google's SREs are on call for your database, not you.

### 4.2 Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile apps | **React Native (Expo) + TypeScript** | One codebase for iOS/Android (matches your deck); Expo's EAS gives you managed builds, OTA updates for hotfixes, and push notifications out of the box. TypeScript end-to-end reduces a whole class of bugs. |
| Backend | **Node.js + NestJS (TypeScript)** on **Cloud Run** | NestJS enforces the module structure that keeps a monolith clean; Cloud Run autoscales (to zero at night, up under load), gives HTTPS and revisions/rollbacks for free. Same language across stack keeps a small team fast. |
| Database | **PostgreSQL (Cloud SQL) + PostGIS** | Relational integrity for money and bookings is non-negotiable; PostGIS handles all geospatial matching natively. Enable point-in-time recovery + automated backups day one. |
| Cache / ephemeral | **Redis (Memorystore)** | Live driver locations, rate limiting, matching candidate caches. Location pings do not belong in Postgres. |
| Realtime tracking | **Firebase Realtime Database** (or Firestore) as the location channel | Driver app writes location → subscribed shipper app reads it. Battle-tested, offline-tolerant, and saves you running WebSocket infrastructure. Status *events* still go through your API so Postgres remains the source of truth. |
| Async jobs | **Cloud Tasks + Pub/Sub** | Payout release timers, notification fan-out, matching recomputes, document processing. |
| Auth | **Firebase Auth** (email/phone/OTP) issuing tokens your backend verifies; roles/permissions live in your DB | Solid, cheap, handles OTP SMS and token rotation. |
| Payments | **Stripe Connect** (Express accounts, destination charges, manual payout release) | Escrow-style flow, KYC, PCI, NZ payouts all handled. |
| Maps & routing | **Google Maps Platform**: Routes API (detour computation), Geocoding, Address Validation, Maps SDK | Matches your deck; Address Validation at entry time prevents an entire category of failed pickups. |
| File storage | **Cloud Storage** with signed URLs | POD photos, licence/insurance docs. Private buckets only; time-limited signed URLs for access. |
| Observability | **Sentry** (app + API errors), Cloud Logging/Monitoring, **UptimeRobot/Better Stack** for alerts | You must know it's broken before a customer tells you. |
| CI/CD | **GitHub Actions** → Cloud Run deploys; **EAS** for app builds; staging environment that mirrors prod (separate GCP project) | Never test in production; separate projects give clean IAM/blast-radius separation. |

### 4.3 High-level flow

```
Shipper app ─┐                                   ┌─ Firebase Auth (identity)
Driver app ──┼── HTTPS ──> NestJS API (Cloud Run) ┼─ Cloud SQL Postgres+PostGIS (truth)
Admin web ───┘                │                   ├─ Redis (live state, rate limits)
                              │                   ├─ Stripe (money)
                              ├─> Pub/Sub / Cloud Tasks (async: payouts, notifications)
                              ├─> Cloud Storage (photos, docs — signed URLs)
                              └─> Google Maps Platform (routing, geocoding)
Driver location ──> Firebase RTDB ──> Shipper app (read-only, per-booking channel)
```

---

## 5. Data model

Core schema (simplified; every table also carries `created_at`, `updated_at`, and money tables carry immutable audit rows):

```sql
-- Identity & trust
users(id, firebase_uid, email, phone, full_name, role, status, created_at)
organisations(id, name, nzbn, type ENUM('shipper','carrier','both'), verified_at)
organisation_members(org_id, user_id, member_role)
verification_documents(id, org_id|user_id, doc_type ENUM('licence','insurance','id','rego'),
                       storage_path, status ENUM('pending','approved','rejected'),
                       reviewed_by, reviewed_at, expires_at)   -- insurance/licences expire!
drivers(id, user_id, org_id, licence_class, licence_expiry, status)
vehicles(id, org_id, rego, make_model, body_type, max_volume_m3, max_weight_kg,
         enclosed BOOL, insurance_doc_id)

-- Supply side
trips(id, org_id, driver_id, vehicle_id,
      origin_geog GEOGRAPHY(POINT), destination_geog GEOGRAPHY(POINT),
      origin_address_id, destination_address_id,
      departure_window_start, departure_window_end,
      route_polyline, available_volume_m3, available_weight_kg,
      accepted_categories TEXT[], status, recurrence_rule)

-- Demand side
addresses(id, formatted, geog GEOGRAPHY(POINT), place_id, validated BOOL, notes)
shipments(id, shipper_org_id, pickup_address_id, dropoff_address_id,
          ready_from, deliver_by, declared_value_nzd, notes, status)
shipment_items(id, shipment_id, cargo_category, packaging_type,     -- the NZ Post pattern
               qty, weight_kg, length_cm, width_cm, height_cm, photos JSONB)

-- The marketplace transaction
bookings(id, shipment_id, trip_id, quoted_price_nzd, platform_fee_nzd,
         carrier_payout_nzd, status, pickup_qr_token, delivery_code,
         cancelled_by, cancellation_reason)
booking_events(id, booking_id, event_type,        -- immutable, append-only timeline
               actor_user_id, occurred_at, geog GEOGRAPHY(POINT),
               metadata JSONB)                     -- reason codes, photo refs, etc.
pod_records(id, booking_id, recipient_name, signature_path, photo_paths JSONB,
            geog, captured_at, device_info JSONB)
exceptions(id, booking_id, raised_by, type ENUM('damage','mismatch','no_show',
           'oversize','access','other'), description, photo_paths JSONB,
           status, resolved_by, resolution)

-- Money (never mutate, only append)
payments(id, booking_id, stripe_payment_intent_id, amount_nzd, status, captured_at)
payouts(id, booking_id, org_id, stripe_transfer_id, amount_nzd,
        scheduled_release_at, released_at, status)
refunds(id, payment_id, amount_nzd, reason, stripe_refund_id, issued_by)

-- Community & safety
ratings(id, booking_id, rater_user_id, ratee_org_id, stars, comment)
disputes(id, booking_id, opened_by, category, status, outcome, admin_notes)
messages(id, booking_id, sender_user_id, body, sent_at)   -- scoped to a booking, retained for disputes
```

Design principles baked in:

- **`booking_events` is the spine of the product.** Every status change, scan, photo, exception, and delay is an immutable row with actor, GPS, and timestamp. Disputes, support, analytics, and the shipper's tracking screen are all views over this table.
- **Status is a strict state machine**, enforced in the API, not the client:
  `booked → driver_en_route → arrived_pickup → picked_up → in_transit → arrived_dropoff → delivered → completed`, with `exception_hold` and `cancelled` as branch states. Geofence checks gate `arrived_*` transitions (driver must be within ~200 m); QR scan gates `picked_up`; POD gates `delivered`; the dispute-window timer gates `completed` (which triggers payout).
- **Money tables are append-only** and every NZD amount is stored in cents as integers. Reconcile against Stripe nightly by job, not by hope.
- **Documents expire.** Insurance and licences have `expires_at`; a job suspends carriers whose documents lapse. This is the kind of quiet detail that separates a professional platform from a liability.

---

## 6. Security & compliance (NZ-specific)

Treat this as a launch checklist, not aspirations:

**Application security**
- TLS everywhere; HSTS. Cloud Run + managed certs make this free.
- Firebase-issued tokens verified server-side on every request; short-lived access tokens; role + resource-level authorisation checks in the API (a shipper can only read *their* bookings — test this explicitly, IDOR is the most common marketplace vuln).
- All input validated with schemas (Zod/class-validator); parameterised queries only (use Prisma or TypeORM — no string SQL).
- Rate limiting (Redis) on auth, search, and messaging endpoints; device attestation (Play Integrity / App Attest) on status-transition endpoints if fraud appears.
- Private storage buckets; photos and documents served only via short-lived signed URLs; EXIF stripped from user-visible photos but GPS retained server-side on POD evidence.
- Secrets in GCP Secret Manager; least-privilege IAM; separate staging/prod projects; no shared admin credentials — admin dashboard behind SSO + 2FA.
- Dependency scanning (Dependabot) and one external penetration test before public launch. Budget NZ$8–15k; it is worth it for a platform holding money and PII.

**Money safety**
- Escrow-style flow: capture at booking, hold, release on POD + dispute window. Never let the platform balance go negative on refunds — model cancellation tiers (free >24h, partial <24h, none after pickup) explicitly.
- Webhook signature verification on all Stripe events; idempotency keys on every payment mutation.

**Privacy Act 2020**
- You will hold names, addresses, location trails, licence photos, and financial links — you are an "agency" under the Act. Practical obligations: collect only what you need; publish a plain-English privacy policy; honour access/correction requests; set retention rules (e.g., location trails purged 90 days post-delivery, POD evidence retained 7 years for disputes/tax); and know that **notifiable privacy breaches must be reported to the Office of the Privacy Commissioner** — write the incident-response runbook before you need it.
- Location ethics: track drivers only while a booking is active, tell them so, and never expose a driver's live location to anyone but the paired shipper.

**Operational resilience**
- Cloud SQL automated backups + point-in-time recovery, tested restore (a backup you've never restored is a rumour).
- Error alerting to your phone (Sentry + uptime checks). Status page for users.
- Offline tolerance in the driver app: rural NZ has dead zones. Queue status events and POD captures locally (with device timestamp + GPS) and sync when connectivity returns — the NZ Post app clearly handles this and yours must too.

**Legal scaffolding (get a lawyer for these, briefly)**
- Terms making explicit you are a venue, not a carrier; carrier insurance requirements; prohibited goods list; liability caps referencing the **Contract and Commercial Law Act 2017 carriage-of-goods regime** (which governs carrier liability limits in NZ); CGA/FTA consumer-facing obligations for individual shippers.

---

## 7. Build roadmap

**Phase 0 — Foundations (2–3 weeks)**
Repos, CI/CD, staging + prod GCP projects, NestJS skeleton with auth, Postgres schema v1, Expo app shells, Stripe Connect sandbox, design system (keep it to your existing green/cream brand tokens).

**Phase 1 — Core marketplace (6–8 weeks)**
Verification flows + admin queue → trip creation → shipment creation with structured cargo entry → corridor matching + search → booking + payment capture → masked chat → notifications.

**Phase 2 — The delivery experience (4–6 weeks)**
Driver task flow (the NZ Post-style verbs), QR handover, live tracking channel, POD capture, exception/delay flows, payout release job, ratings, dispute case creation.

**Phase 3 — Hardening (3–4 weeks, do not skip)**
Offline sync, load/failure testing, pen test + fixes, reconciliation jobs, admin tooling polish, app-store review cycle, ToS/privacy policy finalised, pilot with 3–5 Rosebank businesses and 2–3 carriers you already know **before** public launch. Real freight with friendly users will surface issues no test plan will.

Total: roughly 4–5 months to a launchable, trustworthy v1 with a small team. Faster is possible only by cutting trust features, which is the one thing this product cannot cut.

**Cost note:** your deck's ~$2,574/yr fixed cost is understated once real infrastructure, Stripe fees (~2.9% + 30¢ — nearly half your 7% take at $75 bookings), Maps API usage, SMS OTPs, and an incident/insurance buffer are counted. Budget more like NZ$400–700/month at pilot scale and revisit unit economics — a per-booking fee to the shipper (e.g., $1.50 booking fee) alongside the carrier commission is common and would restore margin without changing headline pricing much.

---

## 8. What deliberately isn't in v1 (and why)

- **Microservices, Kafka, Cassandra** — scale architecture for problems you don't have; each one is another thing that can break at 2 a.m.
- **ML-based matching/pricing** — you need months of lane data first; PostGIS + Routes API corridor matching is genuinely good.
- **Dangerous goods, livestock, alcohol, temperature-controlled freight** — each drags in a regulatory regime; add cold-chain later as a certified-carrier tier if demand shows.
- **Cash payments / off-platform payment** — escrow *is* the product's trust core; never allow around it.
- **Instant payouts** — the POD + dispute-window hold protects shippers and you from fraud; carriers will accept 2-day settlement if it's reliable.
