# PICKLE_SPEC.md — Consolidated Product & Technical Specification
_Read together with CLAUDE.md (invariants) and BUILD_PLAN.md (phasing)._

## 1. Product summary

Pickle is a NZ two-sided freight marketplace. Shippers (SMBs **and individuals**) book
spare space in trucks already making a trip; carriers (transport companies and
owner-drivers) list unused capacity. Pickle matches along route corridors, holds payment
in escrow, and provides tracking, structured handover, proof of delivery, ratings, and
dispute resolution. Revenue: 7% carrier-side commission + platform fee per booking
(consider a small shipper booking fee — Stripe's ~2.9% + 30¢ consumes roughly half the
7% take on a $75 booking).

Three roles: **Shipper**, **Carrier/Driver** (an organisation may have multiple drivers;
solo operators get both in one signup), **Admin** (web dashboard).

## 2. Users: businesses AND individuals

- Business shipper onboarding: NZBN lookup (MBIE API) verifies the entity.
- Individual shipper onboarding (lighter lane): verified NZ mobile (OTP) + ID document
  + card on file. Do not force business-grade signup on someone shipping one couch.
- Cargo entry for individuals uses **friendly presets** ("furniture item (large)",
  "a few boxes", "appliance") that map to default dimensions/weight behind the scenes.
  Structured data is still captured; photos are mandatory and carry extra weight.
- Consumer law: individual shippers are consumers — Consumer Guarantees Act and Fair
  Trading Act apply. Cancellation/refund/dispute policies must be consumer-fair; ToS
  cannot waive CGA rights.
- Residential delivery realities: delivery-instructions field, "authority to leave /
  safe drop" option (photo-only POD, no signature), contact-recipient step.
- Prohibited at launch (enforced by category list + ToS + booking declaration):
  dangerous goods, alcohol, weapons, livestock, cash, temperature-controlled freight.

## 3. Carrier verification (manual-first)

Carriers upload driver licence (front/back), vehicle rego, proof of goods-in-transit /
carrier's liability insurance; Stripe Connect onboarding performs KYC + bank verification.
**Nothing is bookable until an admin approves** the account in the dashboard queue —
unverified carriers are invisible to search. Manual review is deliberate at launch
(low volume; also a marketing point: "every carrier is personally vetted").
Documents have `expires_at`; a scheduled job suspends carriers with lapsed insurance
or licences.

## 4. Core flows

### Carrier: trips
Trip = origin, destination, optional via-points, departure window (windows, not exact
times), vehicle, available volume m³ + weight kg, accepted cargo categories,
enclosed/weatherproof flag. Recurring trips supported (e.g., AKL→HAM every Tue/Thu).

### Shipper: shipments
Shipment = pickup + drop-off addresses (Google Address Validation at entry),
cargo category + packaging type + qty + dimensions/volume + weight (or preset),
declared value, photos, ready-from / deliver-by, notes.

### Matching v1 (no ML)
PostGIS corridor matching: candidate trips where pickup & drop-off fall within a detour
tolerance of the route (Google Routes API computes added km/min), time windows overlap,
capacity fits, category accepted. Rank by detour cost, rating, price. Multi-booking trip
optimisation is Phase 2+.

### Booking & payment (Stripe Connect, escrow-style)
Shipper pays full amount at booking (card). Funds captured; **carrier payout held until
POD + 24–48h dispute window**, then transferred to carrier's Connect account minus fees.
Cancellation tiers: free >24h before pickup window; partial <24h; none after pickup.
Refund paths for cancellations and upheld disputes. Nightly reconciliation job against
Stripe.

### Driver workflow (NZ Post-inspired verbs)
Today screen lists stops in route order. Per booking:
Navigate → Arrive (geofenced ~200m) → Scan shipper's QR → photograph goods loaded →
Picked Up → In Transit → Arrive → scan/enter delivery code → POD (photo + recipient name
+ signature, or photo-only if safe-drop authorised) → Delivered.
**Exception** (damage, mismatch, no-show, oversize, access, other) and **Delay** (reason
+ new ETA) are one-tap actions available at every stage. Exceptions pause the money flow
and notify the shipper immediately.

## 5. Booking state machine (server-enforced)

```
booked → driver_en_route → arrived_pickup → picked_up → in_transit
       → arrived_dropoff → delivered → completed
```
Branch states: `exception_hold` (from any active state), `cancelled`.
Gates: geofence check gates `arrived_*`; QR scan gates `picked_up`; POD record gates
`delivered`; dispute-window timer (Cloud Task) gates `completed`, which triggers payout
release. Every transition writes an immutable `booking_events` row (actor, GPS,
timestamp, metadata). Clients never assert state; they request transitions.

## 6. Data model (Prisma over Postgres+PostGIS)

users(id, firebase_uid, email, phone, full_name, role, status)
organisations(id, name, nzbn, type[shipper|carrier|both], verified_at)
organisation_members(org_id, user_id, member_role)
verification_documents(id, owner ref, doc_type[licence|insurance|id|rego], storage_path,
  status[pending|approved|rejected], reviewed_by, reviewed_at, expires_at)
drivers(id, user_id, org_id, licence_class, licence_expiry, status)
vehicles(id, org_id, rego, make_model, body_type, max_volume_m3, max_weight_kg,
  enclosed, insurance_doc_id)
addresses(id, formatted, geog POINT, place_id, validated, notes)
trips(id, org_id, driver_id, vehicle_id, origin_geog, destination_geog, origin_address_id,
  destination_address_id, departure_window_start/end, route_polyline,
  available_volume_m3, available_weight_kg, accepted_categories[], status, recurrence_rule)
shipments(id, shipper_org_id|shipper_user_id, pickup_address_id, dropoff_address_id,
  ready_from, deliver_by, declared_value_cents, notes, status)
shipment_items(id, shipment_id, cargo_category, packaging_type, qty, weight_kg,
  length_cm, width_cm, height_cm, photos jsonb)
bookings(id, shipment_id, trip_id, quoted_price_cents, platform_fee_cents,
  carrier_payout_cents, status, pickup_qr_token, delivery_code, cancelled_by,
  cancellation_reason)
booking_events(id, booking_id, event_type, actor_user_id, occurred_at, geog,
  metadata jsonb)                                  -- APPEND-ONLY
pod_records(id, booking_id, recipient_name, signature_path, photo_paths jsonb, geog,
  captured_at, device_info jsonb)
exceptions(id, booking_id, raised_by, type, description, photo_paths jsonb, status,
  resolved_by, resolution)
payments / payouts / refunds                        -- APPEND-ONLY, integer cents,
                                                    -- Stripe ids, idempotency keys
ratings(id, booking_id, rater_user_id, ratee_org_id|ratee_user_id, stars, comment)
                                                    -- exactly one of ratee_org_id /
                                                    -- ratee_user_id set (individual
                                                    -- shippers have no org); unique
                                                    -- per (booking_id, rater_user_id)
disputes(id, booking_id, opened_by, category, status, outcome, admin_notes)
messages(id, booking_id, sender_user_id, body, sent_at)   -- chat scoped to booking

## 7. Privacy & progressive disclosure

- **Browsing (pre-booking):** carriers appear as trading identity only — name/company,
  rating, vehicle type, verified badge, route + windows, price. Shipments show cargo
  details, photos, suburb-level pickup/drop-off, shipper first name/business + rating.
  NO phone, email, or exact addresses in any listing/search response.
- **On booking (payment captured):** counterparties get exact addresses, delivery
  instructions, recipient name, and a masked in-app chat scoped to the booking.
  Personal phone numbers/emails are never exchanged. (Phase 2: relay-number calling
  via Twilio Proxy.)
- **After completion/dispute-window:** chat freezes read-only, retained as dispute
  evidence. No contact details persist between parties.
- Response DTOs are shaped per role + status. Serializers never emit raw entity rows.
- Driver live location: shared only with the paired shipper, only while their booking is
  active (picked_up → delivered), throttled ~30s, via a per-booking Firebase channel.
- Privacy Act 2020: minimal collection; plain-English policy; access/correction requests
  honoured; retention rules (location trails purged 90 days post-delivery; POD evidence
  kept 7 years); breach-notification runbook (OPC) written before launch.

## 8. Chat design

One thread per booking (no general DMs, no pre-booking contact). Thread interleaves
human messages (text, photos) with injected **system messages** for every booking event
("Picked up ✓", "Delay reported: new ETA 1:15pm"). Composer enabled/disabled by booking
status; thread freezes read-only 48h after completion. Delivery over the existing
Firebase channel + push notifications; rows persist in `messages`. Tone: calm,
procedural, lightly supervised — banking-app, not social.

## 9. Admin dashboard (web, Next.js)

Same API, same auth (admin = role in Postgres, 2FA required), zero special backdoors.
Screens: verification queue (side-by-side document viewer, approve/reject with notes),
live bookings map, dispute cases (full event timeline + chat + POD evidence),
refund/payout controls, user suspension, category & pricing config. Every admin action
writes an audit-log row. Deployed at admin.pickle.co.nz; optionally behind IAP later.

## 10. Stack recap

React Native (Expo, TS) mobile · Next.js admin · NestJS API on Cloud Run · Cloud SQL
Postgres + PostGIS via Prisma · Redis (Memorystore) · Firebase Auth + Realtime DB ·
Stripe Connect · Google Maps Platform (Routes, Geocoding, Address Validation) · Cloud
Storage (private, signed URLs) · Cloud Tasks + Pub/Sub · Sentry + Cloud Monitoring ·
GitHub Actions + EAS · separate staging/prod GCP projects.

Explicit non-goals for v1: microservices, Kafka, Cassandra, ML matching/pricing,
dangerous goods, instant payouts, off-platform payments.
