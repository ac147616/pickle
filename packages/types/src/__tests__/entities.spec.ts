// One representative valid object per schema, parsed for real. Catches
// typos/field-name mismatches against apps/api/prisma/schema.prisma that
// are easy to miss by eyeballing 20 hand-transcribed schemas.
import {
  AddressSchema,
  BookingEventSchema,
  BookingSchema,
  DisputeSchema,
  DriverSchema,
  ExceptionSchema,
  MeResponseSchema,
  MessageSchema,
  OrganisationMemberSchema,
  OrganisationSchema,
  PaymentSchema,
  PayoutSchema,
  PodRecordSchema,
  RatingSchema,
  RefundSchema,
  ShipmentItemSchema,
  ShipmentSchema,
  TripSchema,
  UserSchema,
  VehicleSchema,
  VerificationDocumentSchema,
} from '..';

const id = '123e4567-e89b-12d3-a456-426614174000';
const id2 = '223e4567-e89b-12d3-a456-426614174000';
const ts = '2026-01-01T00:00:00.000Z';

describe('entity schemas parse a representative valid object', () => {
  it('User', () => {
    expect(() =>
      UserSchema.parse({
        id,
        firebaseUid: 'fb-uid',
        email: 'a@example.com',
        phone: null,
        fullName: 'Aroha Ngata',
        role: 'SHIPPER',
        status: 'ACTIVE',
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Organisation', () => {
    expect(() =>
      OrganisationSchema.parse({
        id,
        name: 'Kauri Craft Furniture Ltd',
        nzbn: '9429041234567',
        type: 'SHIPPER',
        verifiedAt: ts,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('OrganisationMember', () => {
    expect(() =>
      OrganisationMemberSchema.parse({
        id,
        organisationId: id2,
        userId: id2,
        memberRole: 'OWNER',
        createdAt: ts,
      }),
    ).not.toThrow();
  });

  it('VerificationDocument', () => {
    expect(() =>
      VerificationDocumentSchema.parse({
        id,
        ownerUserId: id2,
        ownerOrgId: null,
        docType: 'LICENCE',
        storagePath: 'seed/licences/x.pdf',
        status: 'APPROVED',
        reviewedBy: null,
        reviewedAt: null,
        expiresAt: ts,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Driver', () => {
    expect(() =>
      DriverSchema.parse({
        id,
        userId: id2,
        organisationId: id2,
        licenceClass: 'Class 2',
        licenceExpiry: ts,
        status: 'ACTIVE',
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Vehicle', () => {
    expect(() =>
      VehicleSchema.parse({
        id,
        organisationId: id2,
        rego: 'NFC001',
        makeModel: 'Isuzu NPR 75-155',
        bodyType: 'box_truck',
        maxVolumeM3: 12.5,
        maxWeightKg: 2500,
        enclosed: true,
        insuranceDocId: null,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Address', () => {
    expect(() =>
      AddressSchema.parse({
        id,
        formatted: '12 Rosebank Road, Avondale, Auckland 1026, New Zealand',
        lat: -36.8965,
        lng: 174.6942,
        placeId: 'seed-place-rosebank-rd',
        validated: true,
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Trip', () => {
    expect(() =>
      TripSchema.parse({
        id,
        organisationId: id2,
        driverId: id2,
        vehicleId: id2,
        originAddressId: id2,
        destinationAddressId: id2,
        originLat: -36.8965,
        originLng: 174.6942,
        destinationLat: -37.7826,
        destinationLng: 175.2793,
        departureWindowStart: ts,
        departureWindowEnd: ts,
        routePolyline: null,
        availableVolumeM3: 8,
        availableWeightKg: 1200,
        acceptedCategories: ['furniture', 'boxes'],
        status: 'ACTIVE',
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU,TH',
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Shipment', () => {
    expect(() =>
      ShipmentSchema.parse({
        id,
        shipperOrgId: null,
        shipperUserId: id2,
        pickupAddressId: id2,
        dropoffAddressId: id2,
        readyFrom: ts,
        deliverBy: ts,
        declaredValueCents: 45000,
        notes: null,
        status: 'BOOKED',
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('ShipmentItem', () => {
    expect(() =>
      ShipmentItemSchema.parse({
        id,
        shipmentId: id2,
        cargoCategory: 'furniture',
        packagingType: 'wrapped',
        qty: 1,
        weightKg: 60,
        lengthCm: 180,
        widthCm: 90,
        heightCm: 80,
        photos: ['seed/photos/couch-1.jpg'],
        createdAt: ts,
      }),
    ).not.toThrow();
  });

  it('Booking', () => {
    expect(() =>
      BookingSchema.parse({
        id,
        shipmentId: id2,
        tripId: id2,
        quotedPriceCents: 7500,
        platformFeeCents: 525,
        carrierPayoutCents: 6975,
        status: 'BOOKED',
        pickupQrToken: 'seed-qr-token-0001',
        deliveryCode: '482913',
        cancelledBy: null,
        cancellationReason: null,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('BookingEvent', () => {
    expect(() =>
      BookingEventSchema.parse({
        id,
        bookingId: id2,
        eventType: 'PICKED_UP',
        actorUserId: id2,
        occurredAt: ts,
        lat: -36.8965,
        lng: 174.6942,
        metadata: { note: 'left at door' },
      }),
    ).not.toThrow();
  });

  it('PodRecord', () => {
    expect(() =>
      PodRecordSchema.parse({
        id,
        bookingId: id2,
        recipientName: 'Liam Foster',
        signaturePath: null,
        photoPaths: ['seed/pod/photo-1.jpg'],
        lat: -37.7826,
        lng: 175.2793,
        capturedAt: ts,
        deviceInfo: { os: 'android' },
      }),
    ).not.toThrow();
  });

  it('Exception', () => {
    expect(() =>
      ExceptionSchema.parse({
        id,
        bookingId: id2,
        raisedBy: id2,
        type: 'DAMAGE',
        description: 'Corner dented',
        photoPaths: ['seed/exceptions/photo-1.jpg'],
        status: 'OPEN',
        resolvedBy: null,
        resolution: null,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Payment', () => {
    expect(() =>
      PaymentSchema.parse({
        id,
        bookingId: id2,
        amountCents: 7500,
        currency: 'NZD',
        stripePaymentIntentId: 'pi_123',
        status: 'CAPTURED',
        idempotencyKey: 'idem-123',
        createdAt: ts,
      }),
    ).not.toThrow();
  });

  it('Payout', () => {
    expect(() =>
      PayoutSchema.parse({
        id,
        bookingId: id2,
        carrierOrgId: id2,
        amountCents: 6975,
        currency: 'NZD',
        stripeTransferId: null,
        status: 'PENDING',
        idempotencyKey: 'idem-456',
        createdAt: ts,
      }),
    ).not.toThrow();
  });

  it('Refund', () => {
    expect(() =>
      RefundSchema.parse({
        id,
        paymentId: id2,
        amountCents: 1000,
        reason: 'partial cancellation',
        stripeRefundId: null,
        status: 'PENDING',
        idempotencyKey: 'idem-789',
        createdAt: ts,
      }),
    ).not.toThrow();
  });

  it('Rating', () => {
    expect(() =>
      RatingSchema.parse({
        id,
        bookingId: id2,
        raterUserId: id2,
        rateeOrgId: id2,
        rateeUserId: null,
        stars: 5,
        comment: 'Great service',
        createdAt: ts,
      }),
    ).not.toThrow();
  });

  it('Dispute', () => {
    expect(() =>
      DisputeSchema.parse({
        id,
        bookingId: id2,
        openedBy: id2,
        category: 'damage',
        status: 'OPEN',
        outcome: null,
        adminNotes: null,
        createdAt: ts,
        updatedAt: ts,
      }),
    ).not.toThrow();
  });

  it('Message', () => {
    expect(() =>
      MessageSchema.parse({
        id,
        bookingId: id2,
        senderUserId: id2,
        body: 'On my way!',
        sentAt: ts,
      }),
    ).not.toThrow();
  });

  it('MeResponse', () => {
    expect(() =>
      MeResponseSchema.parse({
        id,
        email: 'a@example.com',
        fullName: 'Aroha Ngata',
        role: 'SHIPPER',
        status: 'ACTIVE',
      }),
    ).not.toThrow();
  });
});
