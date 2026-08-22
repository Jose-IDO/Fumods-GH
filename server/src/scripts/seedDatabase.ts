import bcrypt from 'bcrypt';
import { admin, firestore } from '../config/firebaseAdmin';

const SALT_ROUNDS = 12;
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
const DEFAULT_MANAGER_PASSWORD = process.env.SEED_MANAGER_PASSWORD || 'ChangeMe123!';

type SeedDocument = {
  id: string;
  data: Record<string, any>;
};

async function seedCollection(collectionName: string, documents: SeedDocument[]): Promise<void> {
  const collectionRef = firestore.collection(collectionName);
  const existingDocs = await Promise.all(
    documents.map(async (document) => {
      const snapshot = await collectionRef.doc(document.id).get();
      return { id: document.id, exists: snapshot.exists };
    })
  );

  const missingDocuments = documents.filter((_, index) => !existingDocs[index].exists);

  if (missingDocuments.length === 0) {
    console.log(`[seed] ${collectionName}: already seeded (${documents.length} documents)`);
    return;
  }

  const batch = firestore.batch();
  missingDocuments.forEach(({ id, data }) => {
    batch.set(collectionRef.doc(id), data, { merge: false });
  });

  await batch.commit();
  console.log(`[seed] ${collectionName}: created ${missingDocuments.length} document(s)`);
}

async function seedUsers(): Promise<void> {
  const usersCollection = firestore.collection('users');
  const now = admin.firestore.Timestamp.now();

  const adminPasswordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
  const managerPasswordHash = await bcrypt.hash(DEFAULT_MANAGER_PASSWORD, SALT_ROUNDS);

  const adminDocId = 'default-admin';
  const managerDocId = 'default-manager';

  const existingDocs = await Promise.all([
    usersCollection.doc(adminDocId).get(),
    usersCollection.doc(managerDocId).get(),
  ]);

  const batch = firestore.batch();
  const missingUsers: Array<{ id: string; data: Record<string, any> }> = [];

  if (!existingDocs[0].exists) {
    missingUsers.push({
      id: adminDocId,
      data: {
        email: 'admin@deltahotel.com',
        passwordHash: adminPasswordHash,
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+27123456789',
        profileImageUrl: null,
        emailVerified: true,
        isActive: true,
        roles: [
          { id: 'role-super-admin', name: 'super_admin', displayName: 'Administrator', description: 'Full system administrator', isSystemRole: true },
        ],
        roleNames: ['super_admin'],
        searchKeywords: ['admin', 'deltahotel', 'administrator', 'system'],
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      },
    });
  }

  if (!existingDocs[1].exists) {
    missingUsers.push({
      id: managerDocId,
      data: {
        email: 'manager@deltahotel.com',
        passwordHash: managerPasswordHash,
        firstName: 'Hotel',
        lastName: 'Manager',
        phone: '+27123456790',
        profileImageUrl: null,
        emailVerified: true,
        isActive: true,
        roles: [
          { id: 'role-hotel-manager', name: 'hotel_manager', displayName: 'Hotel Manager', description: 'Operational hotel manager', isSystemRole: true },
        ],
        roleNames: ['hotel_manager'],
        searchKeywords: ['manager', 'deltahotel', 'hotel', 'operations'],
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      },
    });
  }

  if (missingUsers.length === 0) {
    console.log('[seed] users: already seeded (2 users)');
    return;
  }

  missingUsers.forEach(({ id, data }) => {
    batch.set(usersCollection.doc(id), data, { merge: false });
  });

  await batch.commit();
  console.log(`[seed] users: created ${missingUsers.length} user(s)`);
}

async function seedDatabase(): Promise<void> {
  const now = admin.firestore.Timestamp.now();

  await seedCollection('roles', [
    { id: 'super_admin', data: { id: 'super_admin', name: 'super_admin', displayName: 'Administrator', description: 'Full system administrator', isSystemRole: true, createdAt: now, updatedAt: now } },
    { id: 'hotel_manager', data: { id: 'hotel_manager', name: 'hotel_manager', displayName: 'Hotel Manager', description: 'Hotel operations manager', isSystemRole: true, createdAt: now, updatedAt: now } },
    { id: 'customer', data: { id: 'customer', name: 'customer', displayName: 'Guest', description: 'Customer account', isSystemRole: true, createdAt: now, updatedAt: now } },
    { id: 'support_agent', data: { id: 'support_agent', name: 'support_agent', displayName: 'Support Agent', description: 'Customer support team member', isSystemRole: true, createdAt: now, updatedAt: now } },
  ]);

  await seedCollection('hotelSettings', [
    {
      id: 'hotel_settings',
      data: {
        hotelName: 'Fumods Guesthouse',
        tagline: 'Modern comfort, refined hospitality',
        description: 'A premium boutique hotel delivering seamless stays for business and leisure travelers.',
        email: 'info@deltahotel.com',
        phone: '+27123456789',
        website: 'https://deltahotel.example',
        addressLine1: '10 Main Road',
        city: 'Johannesburg',
        stateProvince: 'Gauteng',
        postalCode: '2001',
        country: 'South Africa',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        currency: 'ZAR',
        taxRate: 15,
        amenities: ['Free Wi-Fi', 'Parking', 'Breakfast', 'Swimming Pool'],
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
        termsAndConditions: 'Standard hotel terms and conditions apply.',
        createdAt: now,
        updatedAt: now,
      },
    },
  ]);

  await seedCollection('roomTypes', [
    { id: 'deluxe-suite', data: { name: 'Deluxe Suite', displayName: 'Deluxe Suite', description: 'Spacious suite with lounge area and premium amenities.', maxGuests: 2, basePrice: 2200, bedType: 'King' } },
    { id: 'executive-room', data: { name: 'Executive Room', displayName: 'Executive Room', description: 'Modern room with city views and work-friendly setup.', maxGuests: 2, basePrice: 1800, bedType: 'Queen' } },
    { id: 'family-room', data: { name: 'Family Room', displayName: 'Family Room', description: 'Comfortable room designed for parents and children.', maxGuests: 4, basePrice: 2600, bedType: 'Twin' } },
  ]);

  await seedCollection('amenities', [
    { id: 'wifi', data: { name: 'wifi', displayName: 'Free Wi-Fi', description: 'High-speed wireless internet access.', icon: 'wifi' } },
    { id: 'parking', data: { name: 'parking', displayName: 'Parking', description: 'Secure on-site parking.', icon: 'car' } },
    { id: 'breakfast', data: { name: 'breakfast', displayName: 'Breakfast', description: 'Complimentary breakfast buffet.', icon: 'utensils' } },
    { id: 'pool', data: { name: 'pool', displayName: 'Swimming Pool', description: 'Outdoor pool and lounge area.', icon: 'droplet' } },
    { id: 'air-conditioning', data: { name: 'air-conditioning', displayName: 'Air Conditioning', description: 'Climate-controlled rooms.', icon: 'snowflake' } },
  ]);

  await seedCollection('bookingStatuses', [
    { id: 'pending', data: { name: 'pending', displayName: 'Pending', description: 'Awaiting confirmation.', sortOrder: 1, createdAt: now, updatedAt: now } },
    { id: 'confirmed', data: { name: 'confirmed', displayName: 'Confirmed', description: 'Confirmed reservation.', sortOrder: 2, createdAt: now, updatedAt: now } },
    { id: 'cancelled', data: { name: 'cancelled', displayName: 'Cancelled', description: 'Reservation cancelled.', sortOrder: 3, createdAt: now, updatedAt: now } },
  ]);

  await seedCollection('paymentStatuses', [
    { id: 'pending', data: { name: 'pending', displayName: 'Pending', description: 'Awaiting payment confirmation.', sortOrder: 1, createdAt: now, updatedAt: now } },
    { id: 'success', data: { name: 'success', displayName: 'Success', description: 'Payment completed successfully.', sortOrder: 2, createdAt: now, updatedAt: now } },
    { id: 'failed', data: { name: 'failed', displayName: 'Failed', description: 'Payment failed or was declined.', sortOrder: 3, createdAt: now, updatedAt: now } },
    { id: 'refunded', data: { name: 'refunded', displayName: 'Refunded', description: 'Payment was refunded.', sortOrder: 4, createdAt: now, updatedAt: now } },
  ]);

  await seedCollection('notificationTypes', [
    { id: 'booking_confirmation', data: { name: 'booking_confirmation', displayName: 'Booking Confirmation', description: 'Booking confirmation updates.', createdAt: now, updatedAt: now } },
    { id: 'booking_update', data: { name: 'booking_update', displayName: 'Booking Update', description: 'Booking status updates.', createdAt: now, updatedAt: now } },
    { id: 'promotion', data: { name: 'promotion', displayName: 'Promotion', description: 'Promotional messages from the hotel.', createdAt: now, updatedAt: now } },
    { id: 'general', data: { name: 'general', displayName: 'General', description: 'General notifications.', createdAt: now, updatedAt: now } },
  ]);

  await seedUsers();

  await seedCollection('rooms', [
    {
      id: 'room-deluxe-suite',
      data: {
        roomName: 'Deluxe Suite',
        roomType: 'deluxe-suite',
        price: 2200,
        maxGuests: 2,
        bedType: 'King',
        numberOfBeds: 1,
        roomSizeSqm: 55,
        amenities: ['wifi', 'parking', 'breakfast', 'air-conditioning'],
        units: [{ unitNumber: '101' }],
        status: 'active',
        images: [],
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      id: 'room-executive-room',
      data: {
        roomName: 'Executive Room',
        roomType: 'executive-room',
        price: 1800,
        maxGuests: 2,
        bedType: 'Queen',
        numberOfBeds: 1,
        roomSizeSqm: 38,
        amenities: ['wifi', 'breakfast', 'air-conditioning'],
        units: [{ unitNumber: '205' }],
        status: 'active',
        images: [],
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      id: 'room-family-room',
      data: {
        roomName: 'Family Room',
        roomType: 'family-room',
        price: 2600,
        maxGuests: 4,
        bedType: 'Twin',
        numberOfBeds: 2,
        roomSizeSqm: 48,
        amenities: ['wifi', 'parking', 'pool', 'air-conditioning'],
        units: [{ unitNumber: '309' }],
        status: 'active',
        images: [],
        createdAt: now,
        updatedAt: now,
      },
    },
  ]);

  await seedCollection('events', [
    {
      id: 'event-sunset-dinner',
      data: {
        title: 'Sunset Dinner Experience',
        date: '2026-08-20',
        description: 'An intimate rooftop dinner with live jazz and chef specials.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      id: 'event-wellness-weekend',
      data: {
        title: 'Wellness Weekend',
        date: '2026-09-05',
        description: 'A restorative wellness retreat including yoga, spa treatments, and healthy dining.',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        createdAt: now,
        updatedAt: now,
      },
    },
  ]);

  await seedCollection('deals', [
    {
      id: 'deal-summer-special',
      data: {
        id: 1001,
        roomId: 'room-deluxe-suite',
        title: 'Summer Escape Special',
        description: 'Enjoy a premium suite stay with 15% off for weekend reservations.',
        discountPercentage: 15,
        startDate: admin.firestore.Timestamp.fromDate(new Date('2026-08-01T00:00:00.000Z')),
        endDate: admin.firestore.Timestamp.fromDate(new Date('2026-08-31T23:59:59.999Z')),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    {
      id: 'deal-family-stay',
      data: {
        id: 1002,
        roomId: 'room-family-room',
        title: 'Family Stay Offer',
        description: 'Book a family room and receive a complimentary breakfast upgrade.',
        discountPercentage: 10,
        startDate: admin.firestore.Timestamp.fromDate(new Date('2026-09-01T00:00:00.000Z')),
        endDate: admin.firestore.Timestamp.fromDate(new Date('2026-10-15T23:59:59.999Z')),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  ]);

  console.log('[seed] Firestore seeding completed successfully');
}

async function main(): Promise<void> {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('[seed] Failed to seed Firestore', error);
    process.exitCode = 1;
  }
}

void main();
