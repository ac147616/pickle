import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Addresses on the Auckland Rosebank <-> Hamilton corridor (BUILD_PLAN's
  // own pilot route and the spec's "AKL -> HAM every Tue/Thu" example).
  const pickupAddress = await prisma.address.create({
    data: {
      formatted: '12 Rosebank Road, Avondale, Auckland 1026, New Zealand',
      lat: -36.8965,
      lng: 174.6942,
      placeId: 'seed-place-rosebank-rd',
      validated: true,
    },
  });

  const dropoffAddress = await prisma.address.create({
    data: {
      formatted: '5 Victoria Street, Hamilton Central, Hamilton 3204, New Zealand',
      lat: -37.7826,
      lng: 175.2793,
      placeId: 'seed-place-victoria-st',
      validated: true,
    },
  });

  // Individual shipper - lighter onboarding lane, no organisation.
  const individualShipper = await prisma.user.create({
    data: {
      firebaseUid: 'seed-firebase-uid-shipper-individual',
      email: 'aroha.ngata@example.co.nz',
      phone: '+64211234567',
      fullName: 'Aroha Ngata',
      role: 'SHIPPER',
    },
  });

  // Business shipper - NZBN-verified lane.
  const businessShipperOwner = await prisma.user.create({
    data: {
      firebaseUid: 'seed-firebase-uid-shipper-business-owner',
      email: 'ops@kauricraftfurniture.co.nz',
      fullName: 'Liam Foster',
      role: 'SHIPPER',
    },
  });

  const businessShipperOrg = await prisma.organisation.create({
    data: {
      name: 'Kauri Craft Furniture Ltd',
      nzbn: '9429041234567',
      type: 'SHIPPER',
      verifiedAt: new Date(),
      members: { create: { userId: businessShipperOwner.id, memberRole: 'OWNER' } },
    },
  });

  // Carrier - solo owner-driver wearing both org-owner and driver hats.
  const carrierUser = await prisma.user.create({
    data: {
      firebaseUid: 'seed-firebase-uid-carrier-driver',
      email: 'dave@northlandfreight.co.nz',
      phone: '+64279876543',
      fullName: 'Dave Mitchell',
      role: 'CARRIER',
    },
  });

  const carrierOrg = await prisma.organisation.create({
    data: {
      name: 'Northland Freight Co',
      nzbn: '9429048765432',
      type: 'CARRIER',
      verifiedAt: new Date(),
      members: { create: { userId: carrierUser.id, memberRole: 'OWNER' } },
    },
  });

  await prisma.verificationDocument.create({
    data: {
      ownerUserId: carrierUser.id,
      docType: 'LICENCE',
      storagePath: 'seed/licences/dave-mitchell-class-2.pdf',
      status: 'APPROVED',
      reviewedAt: new Date(),
      expiresAt: new Date('2028-06-30'),
    },
  });

  const driver = await prisma.driver.create({
    data: {
      userId: carrierUser.id,
      organisationId: carrierOrg.id,
      licenceClass: 'Class 2',
      licenceExpiry: new Date('2028-06-30'),
      status: 'ACTIVE',
    },
  });

  const insuranceDoc = await prisma.verificationDocument.create({
    data: {
      ownerOrgId: carrierOrg.id,
      docType: 'INSURANCE',
      storagePath: 'seed/insurance/northland-freight-goods-in-transit.pdf',
      status: 'APPROVED',
      reviewedAt: new Date(),
      expiresAt: new Date('2027-03-31'),
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      organisationId: carrierOrg.id,
      rego: 'NFC001',
      makeModel: 'Isuzu NPR 75-155',
      bodyType: 'box_truck',
      maxVolumeM3: 12.5,
      maxWeightKg: 2500,
      enclosed: true,
      insuranceDocId: insuranceDoc.id,
    },
  });

  const departureStart = new Date();
  departureStart.setDate(departureStart.getDate() + 2);
  departureStart.setHours(8, 0, 0, 0);
  const departureEnd = new Date(departureStart);
  departureEnd.setHours(10, 0, 0, 0);

  const trip = await prisma.trip.create({
    data: {
      organisationId: carrierOrg.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      originAddressId: pickupAddress.id,
      destinationAddressId: dropoffAddress.id,
      originLat: pickupAddress.lat,
      originLng: pickupAddress.lng,
      destinationLat: dropoffAddress.lat,
      destinationLng: dropoffAddress.lng,
      departureWindowStart: departureStart,
      departureWindowEnd: departureEnd,
      availableVolumeM3: 8,
      availableWeightKg: 1200,
      acceptedCategories: ['furniture', 'boxes', 'appliance'],
      status: 'ACTIVE',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU,TH',
    },
  });

  // Individual shipper's shipment: one large furniture item via the
  // friendly-preset flow described in the spec.
  const shipment = await prisma.shipment.create({
    data: {
      shipperUserId: individualShipper.id,
      pickupAddressId: pickupAddress.id,
      dropoffAddressId: dropoffAddress.id,
      readyFrom: departureStart,
      deliverBy: new Date(departureStart.getTime() + 24 * 60 * 60 * 1000),
      declaredValueCents: 45000,
      notes: 'Please call on arrival, no lift access.',
      status: 'BOOKED',
      items: {
        create: {
          cargoCategory: 'furniture',
          packagingType: 'wrapped',
          qty: 1,
          weightKg: 60,
          lengthCm: 180,
          widthCm: 90,
          heightCm: 80,
          photos: ['seed/photos/couch-1.jpg'],
        },
      },
    },
  });

  const booking = await prisma.booking.create({
    data: {
      shipmentId: shipment.id,
      tripId: trip.id,
      quotedPriceCents: 7500,
      platformFeeCents: 525,
      carrierPayoutCents: 6975,
      status: 'BOOKED',
      pickupQrToken: 'seed-qr-token-0001',
      deliveryCode: '482913',
    },
  });

  console.log('Seeded:', {
    individualShipper: individualShipper.email,
    businessShipperOrg: businessShipperOrg.name,
    carrierOrg: carrierOrg.name,
    trip: trip.id,
    shipment: shipment.id,
    booking: booking.id,
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
