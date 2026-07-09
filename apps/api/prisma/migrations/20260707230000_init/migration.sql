-- CreateExtension
-- Must run before any table uses the `geography` type below.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SHIPPER', 'CARRIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('SHIPPER', 'CARRIER', 'BOTH');

-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'DRIVER', 'STAFF');

-- CreateEnum
CREATE TYPE "VerificationDocType" AS ENUM ('LICENCE', 'INSURANCE', 'ID', 'REGO');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'LISTED', 'BOOKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'DRIVER_EN_ROUTE', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_DROPOFF', 'DELIVERED', 'COMPLETED', 'EXCEPTION_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('DAMAGE', 'MISMATCH', 'NO_SHOW', 'OVERSIZE', 'ACCESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_CAPTURE', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nzbn" TEXT,
    "type" "OrgType" NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_members" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "member_role" "OrgMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "owner_org_id" UUID,
    "doc_type" "VerificationDocType" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "licence_class" TEXT NOT NULL,
    "licence_expiry" TIMESTAMP(3) NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "rego" TEXT NOT NULL,
    "make_model" TEXT NOT NULL,
    "body_type" TEXT NOT NULL,
    "max_volume_m3" DECIMAL(8,2) NOT NULL,
    "max_weight_kg" DECIMAL(8,2) NOT NULL,
    "enclosed" BOOLEAN NOT NULL DEFAULT false,
    "insurance_doc_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "formatted" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "geog" geography(Point, 4326),
    "place_id" TEXT,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "driver_id" UUID,
    "vehicle_id" UUID NOT NULL,
    "origin_address_id" UUID NOT NULL,
    "destination_address_id" UUID NOT NULL,
    "origin_lat" DOUBLE PRECISION,
    "origin_lng" DOUBLE PRECISION,
    "origin_geog" geography(Point, 4326),
    "destination_lat" DOUBLE PRECISION,
    "destination_lng" DOUBLE PRECISION,
    "destination_geog" geography(Point, 4326),
    "departure_window_start" TIMESTAMP(3) NOT NULL,
    "departure_window_end" TIMESTAMP(3) NOT NULL,
    "route_polyline" TEXT,
    "available_volume_m3" DECIMAL(8,2) NOT NULL,
    "available_weight_kg" DECIMAL(8,2) NOT NULL,
    "accepted_categories" TEXT[],
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "recurrence_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "shipper_org_id" UUID,
    "shipper_user_id" UUID,
    "pickup_address_id" UUID NOT NULL,
    "dropoff_address_id" UUID NOT NULL,
    "ready_from" TIMESTAMP(3) NOT NULL,
    "deliver_by" TIMESTAMP(3) NOT NULL,
    "declared_value_cents" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_items" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "cargo_category" TEXT NOT NULL,
    "packaging_type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "weight_kg" DECIMAL(8,2) NOT NULL,
    "length_cm" DECIMAL(8,2) NOT NULL,
    "width_cm" DECIMAL(8,2) NOT NULL,
    "height_cm" DECIMAL(8,2) NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "quoted_price_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL,
    "carrier_payout_cents" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "pickup_qr_token" TEXT NOT NULL,
    "delivery_code" TEXT NOT NULL,
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_events" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_user_id" UUID,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "geog" geography(Point, 4326),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pod_records" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "recipient_name" TEXT,
    "signature_path" TEXT,
    "photo_paths" JSONB NOT NULL DEFAULT '[]',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "geog" geography(Point, 4326),
    "captured_at" TIMESTAMP(3) NOT NULL,
    "device_info" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "pod_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exceptions" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "raised_by" UUID NOT NULL,
    "type" "ExceptionType" NOT NULL,
    "description" TEXT,
    "photo_paths" JSONB NOT NULL DEFAULT '[]',
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_by" UUID,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NZD',
    "stripe_payment_intent_id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "carrier_org_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NZD',
    "stripe_transfer_id" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT,
    "stripe_refund_id" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "rater_user_id" UUID NOT NULL,
    "ratee_org_id" UUID,
    "ratee_user_id" UUID,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "opened_by" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "outcome" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_nzbn_key" ON "organisations"("nzbn");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_members_org_id_user_id_key" ON "organisation_members"("org_id", "user_id");

-- CreateIndex
CREATE INDEX "verification_documents_status_idx" ON "verification_documents"("status");

-- CreateIndex
CREATE INDEX "verification_documents_expires_at_idx" ON "verification_documents"("expires_at");

-- CreateIndex
CREATE INDEX "drivers_org_id_idx" ON "drivers"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_rego_key" ON "vehicles"("rego");

-- CreateIndex
CREATE INDEX "vehicles_org_id_idx" ON "vehicles"("org_id");

-- CreateIndex
CREATE INDEX "trips_org_id_idx" ON "trips"("org_id");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "shipments_shipper_org_id_idx" ON "shipments"("shipper_org_id");

-- CreateIndex
CREATE INDEX "shipments_shipper_user_id_idx" ON "shipments"("shipper_user_id");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipment_items_shipment_id_idx" ON "shipment_items"("shipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_pickup_qr_token_key" ON "bookings"("pickup_qr_token");

-- CreateIndex
CREATE INDEX "bookings_shipment_id_idx" ON "bookings"("shipment_id");

-- CreateIndex
CREATE INDEX "bookings_trip_id_idx" ON "bookings"("trip_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "booking_events_booking_id_idx" ON "booking_events"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "pod_records_booking_id_key" ON "pod_records"("booking_id");

-- CreateIndex
CREATE INDEX "exceptions_booking_id_idx" ON "exceptions"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_stripe_transfer_id_key" ON "payouts"("stripe_transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_idempotency_key_key" ON "payouts"("idempotency_key");

-- CreateIndex
CREATE INDEX "payouts_booking_id_idx" ON "payouts"("booking_id");

-- CreateIndex
CREATE INDEX "payouts_carrier_org_id_idx" ON "payouts"("carrier_org_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_stripe_refund_id_key" ON "refunds"("stripe_refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_idempotency_key_key" ON "refunds"("idempotency_key");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_booking_id_rater_user_id_key" ON "ratings"("booking_id", "rater_user_id");

-- CreateIndex
CREATE INDEX "disputes_booking_id_idx" ON "disputes"("booking_id");

-- CreateIndex
CREATE INDEX "messages_booking_id_idx" ON "messages"("booking_id");

-- AddForeignKey
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_owner_org_id_fkey" FOREIGN KEY ("owner_org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_insurance_doc_id_fkey" FOREIGN KEY ("insurance_doc_id") REFERENCES "verification_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_origin_address_id_fkey" FOREIGN KEY ("origin_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_address_id_fkey" FOREIGN KEY ("destination_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipper_org_id_fkey" FOREIGN KEY ("shipper_org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipper_user_id_fkey" FOREIGN KEY ("shipper_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pickup_address_id_fkey" FOREIGN KEY ("pickup_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_dropoff_address_id_fkey" FOREIGN KEY ("dropoff_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pod_records" ADD CONSTRAINT "pod_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_carrier_org_id_fkey" FOREIGN KEY ("carrier_org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_user_id_fkey" FOREIGN KEY ("rater_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_org_id_fkey" FOREIGN KEY ("ratee_org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_user_id_fkey" FOREIGN KEY ("ratee_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint: shipper is exactly one of an org (business lane) or a user (individual lane).
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipper_xor_chk"
  CHECK ((("shipper_org_id" IS NOT NULL)::int + ("shipper_user_id" IS NOT NULL)::int) = 1);

-- CheckConstraint: ratee is exactly one of an org or a user (individual shippers have no org).
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_xor_chk"
  CHECK ((("ratee_org_id" IS NOT NULL)::int + ("ratee_user_id" IS NOT NULL)::int) = 1);

-- CheckConstraint: verification document owner is exactly one of a user or an org.
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_owner_xor_chk"
  CHECK ((("owner_user_id" IS NOT NULL)::int + ("owner_org_id" IS NOT NULL)::int) = 1);

-- Geography sync: geog columns are derived from lat/lng by trigger, never
-- written directly, so the two can never drift out of sync. Prisma can't see
-- `geography` columns at all (Unsupported type), so application code only
-- ever touches lat/lng - this is the sole place geog is written.
CREATE OR REPLACE FUNCTION make_geog(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS geography AS $$
  SELECT CASE
    WHEN lat IS NULL OR lng IS NULL THEN NULL
    ELSE ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION addresses_sync_geog() RETURNS trigger AS $$
BEGIN
  NEW.geog := make_geog(NEW.lat, NEW.lng);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_addresses_sync_geog
BEFORE INSERT OR UPDATE OF lat, lng ON "addresses"
FOR EACH ROW EXECUTE FUNCTION addresses_sync_geog();

CREATE OR REPLACE FUNCTION trips_sync_geog() RETURNS trigger AS $$
BEGIN
  NEW.origin_geog := make_geog(NEW.origin_lat, NEW.origin_lng);
  NEW.destination_geog := make_geog(NEW.destination_lat, NEW.destination_lng);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trips_sync_geog
BEFORE INSERT OR UPDATE OF origin_lat, origin_lng, destination_lat, destination_lng ON "trips"
FOR EACH ROW EXECUTE FUNCTION trips_sync_geog();

CREATE OR REPLACE FUNCTION booking_events_sync_geog() RETURNS trigger AS $$
BEGIN
  NEW.geog := make_geog(NEW.lat, NEW.lng);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_events_sync_geog
BEFORE INSERT OR UPDATE OF lat, lng ON "booking_events"
FOR EACH ROW EXECUTE FUNCTION booking_events_sync_geog();

CREATE OR REPLACE FUNCTION pod_records_sync_geog() RETURNS trigger AS $$
BEGIN
  NEW.geog := make_geog(NEW.lat, NEW.lng);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pod_records_sync_geog
BEFORE INSERT OR UPDATE OF lat, lng ON "pod_records"
FOR EACH ROW EXECUTE FUNCTION pod_records_sync_geog();

-- Append-only enforcement: the restricted runtime role (pickle_app, created
-- by docker/postgres-init/01-app-role.sh) gets its broad SELECT/INSERT/
-- UPDATE/DELETE grant automatically via ALTER DEFAULT PRIVILEGES for every
-- table the migrator creates. Narrow it here for the tables the spec marks
-- APPEND-ONLY: no UPDATE, no DELETE, ever - only SELECT and INSERT.
-- Table owners/superusers always bypass this, which is exactly why
-- migrations run as a different, more privileged role (see prisma.config.ts).
REVOKE UPDATE, DELETE ON "booking_events" FROM pickle_app;
REVOKE UPDATE, DELETE ON "payments" FROM pickle_app;
REVOKE UPDATE, DELETE ON "payouts" FROM pickle_app;
REVOKE UPDATE, DELETE ON "refunds" FROM pickle_app;
