import { firestore, admin } from '../config/firebaseAdmin';
import { Booking, CreateBookingDTO } from '../types/booking.types';
import { freeRooms, HOLD_MS, isBlocking, TOTAL_ROOMS, validateStay } from '../utils/bookingRules';
import { createHash, randomUUID } from 'crypto';

const bookingsCollection = firestore.collection('bookings');
// Every reservation/status change reads and updates this shared document. This
// serializes competing transactions even when no matching booking existed yet.
const inventoryLock = firestore.collection('bookingInventory').doc('guesthouse');

function documentToBooking(doc: admin.firestore.DocumentSnapshot): Booking | null {
  if (!doc.exists) return null;
  const data = doc.data() as any;
  return {
    id: doc.id,
    userId: data.userId,
    roomId: data.roomId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guests: data.guests,
    totalPrice: Number(data.totalPrice),
    status: data.status === 'pending' && data.expiresAt && (data.expiresAt.toMillis ? data.expiresAt.toMillis() : Date.parse(data.expiresAt)) <= Date.now() ? 'expired' : data.status,
    paymentReference: data.paymentReference || undefined,
    expiresAt: data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate().toISOString() : new Date(data.expiresAt).toISOString()) : undefined,
    roomCount: data.roomCount ?? 1,
    roomSelections: data.roomSelections,
    physicalRoomIds: data.physicalRoomIds,
    babies: data.babies || 0,
    paymentStatus: data.paymentStatus || 'unpaid',
    guestDetails: data.guestDetails,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    confirmationEmailSentAt: data.confirmationEmailSentAt?.toDate ? data.confirmationEmailSentAt.toDate().toISOString() : data.confirmationEmailSentAt,
  };
}

export class BookingRepository {
  async reserve(userId: string, dto: CreateBookingDTO): Promise<Booking> {
    const key = dto.requestId ? createHash('sha256').update(userId + ':' + dto.requestId).digest('hex') : randomUUID();
    const ref = bookingsCollection.doc(key);
    await firestore.runTransaction(async tx => {
      await tx.get(inventoryLock);
      const existing = await tx.get(ref);
      if (existing.exists) {
        const previous = documentToBooking(existing)!;
        if (previous.roomId !== dto.roomId || previous.checkIn !== dto.checkIn || previous.checkOut !== dto.checkOut || JSON.stringify(previous.roomSelections) !== JSON.stringify(dto.roomSelections)) throw new Error('This booking request was already used. Please start a new booking.');
        return;
      }
      const roomDoc = await tx.get(firestore.collection('rooms').doc(dto.roomId));
      const room = roomDoc.data();
      if (!roomDoc.exists || room?.status !== 'active') throw new Error('Room not available');
      const snapshot = await tx.get(bookingsCollection.where('status', 'in', ['pending', 'confirmed']));
      const now = Date.now();
      validateStay(dto.checkIn, dto.checkOut, now);
      const active = snapshot.docs.map(documentToBooking).filter((b): b is Booking => !!b);
      const available = freeRooms(active, dto.checkIn, dto.checkOut, now);
      if (available.length < dto.roomCount) throw new Error(`Only ${available.length} room(s) available for those dates. Please change your dates or room count.`);
      const nights = (Date.parse(dto.checkOut) - Date.parse(dto.checkIn)) / 86400000;
      const price = Number(room?.price);
      if (!Number.isFinite(price) || price <= 0) throw new Error('Room price is unavailable');
      tx.create(ref, {
        userId, roomId: dto.roomId, checkIn: dto.checkIn, checkOut: dto.checkOut,
        guests: dto.roomSelections.reduce((sum, r) => sum + r.adults, 0),
        babies: dto.roomSelections.reduce((sum, r) => sum + r.babies, 0),
        roomCount: dto.roomCount, roomSelections: dto.roomSelections,
        physicalRoomIds: available.slice(0, dto.roomCount), guestDetails: dto.guestDetails,
        totalPrice: nights * price * dto.roomCount,
        status: 'pending', paymentStatus: 'unpaid', paymentReference: 'bk_' + ref.id,
        expiresAt: admin.firestore.Timestamp.fromMillis(now + HOLD_MS),
        createdAt: admin.firestore.Timestamp.fromMillis(now), updatedAt: admin.firestore.Timestamp.fromMillis(now),
      });
      tx.set(inventoryLock, { revision: admin.firestore.FieldValue.increment(1) }, { merge: true });
    });
    return (await this.findById(ref.id))!;
  }

  async availability(checkIn: string, checkOut: string) {
    validateStay(checkIn, checkOut);
    const bookings = await this.findInRange(checkIn, checkOut);
    return { totalRooms: TOTAL_ROOMS, availableRooms: freeRooms(bookings, checkIn, checkOut).length };
  }

  async findByUser(userId: string): Promise<Booking[]> {
    const snapshot = await bookingsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(documentToBooking).filter((b): b is Booking => b !== null);
  }

  async findByUserFiltered(userId: string, options: { status?: Booking['status'][]; start?: string; end?: string; limit?: number; offset?: number }): Promise<Booking[]> {
    const snapshot = await bookingsCollection.where('userId', '==', userId).get();
    const bookings = snapshot.docs.map(documentToBooking).filter((b): b is Booking => !!b
      && (!options.status?.length || options.status.includes(b.status))
      && (!options.start || b.checkOut > options.start)
      && (!options.end || b.checkIn < options.end))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const offset = options.offset ?? 0;
    return bookings.slice(offset, offset + (options.limit ?? 20));
  }

  async countByUserFiltered(userId: string, options: { status?: Booking['status'][]; start?: string; end?: string }): Promise<number> {
    return (await this.findByUserFiltered(userId, { ...options, limit: Number.MAX_SAFE_INTEGER })).length;
  }

  async findById(id: string): Promise<Booking | null> {
    const doc = await bookingsCollection.doc(id).get();
    return documentToBooking(doc);
  }

  async findByPaymentReference(paymentRef: string): Promise<Booking | null> {
    const snapshot = await bookingsCollection.where('paymentReference', '==', paymentRef).limit(1).get();
    if (snapshot.empty) return null;
    return documentToBooking(snapshot.docs[0]);
  }

  async findAll(): Promise<any[]> {
    const snapshot = await bookingsCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs
      .map(documentToBooking)
      .filter((b): b is any => b !== null);
  }

  async updateStatus(id: string, status: 'pending'|'confirmed'|'cancelled'): Promise<Booking | null> {
    if (!['confirmed', 'cancelled'].includes(status)) throw new Error('Choose confirmed or cancelled');
    const ref = bookingsCollection.doc(id);
    await firestore.runTransaction(async tx => {
      await tx.get(inventoryLock);
      const doc = await tx.get(ref);
      const booking = documentToBooking(doc);
      if (!booking) throw new Error('Booking not found');
      if (booking.status === status) return;
      if (status === 'confirmed' && (booking.status !== 'pending' || !isBlocking(booking))) throw new Error('This booking is expired or cancelled. A new booking is required.');
      tx.update(ref, { status, updatedAt: admin.firestore.Timestamp.now() });
      tx.set(inventoryLock, { revision: admin.firestore.FieldValue.increment(1) }, { merge: true });
    });
    return this.findById(id);
  }

  async updatePaymentReference(id: string, paymentRef: string): Promise<Booking | null> {
    await bookingsCollection.doc(id).update({
      paymentReference: paymentRef,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(id);
  }

  async confirmByPaymentRef(paymentRef: string): Promise<Booking | null> {
    const booking = await this.findByPaymentReference(paymentRef);
    if (!booking) return null;
    // Payment never confirms, extends or resurrects a room reservation.
    await bookingsCollection.doc(booking.id).update({ paymentStatus: 'paid', updatedAt: admin.firestore.Timestamp.now() });
    return this.findById(booking.id);
  }

  async markConfirmationEmailSent(id: string): Promise<void> {
    await bookingsCollection.doc(id).update({
      confirmationEmailSentAt: admin.firestore.Timestamp.now(),
    });
  }

  async cancelExpiredPendings(nowIso: string): Promise<number> {
    const snapshot = await bookingsCollection.where('status', '==', 'pending').limit(400).get();
    let count = 0;
    for (const doc of snapshot.docs) {
      if (documentToBooking(doc)?.status !== 'expired') continue;
      const changed = await firestore.runTransaction(async tx => {
        await tx.get(inventoryLock);
        const current = await tx.get(doc.ref);
        const data = current.data();
        const expiry = data?.expiresAt?.toMillis ? data.expiresAt.toMillis() : Date.parse(data?.expiresAt);
        if (data?.status !== 'pending' || expiry > Date.parse(nowIso) || !Number.isFinite(expiry)) return;
        tx.update(doc.ref, { status: 'expired', updatedAt: admin.firestore.Timestamp.now() });
        tx.set(inventoryLock, { revision: admin.firestore.FieldValue.increment(1) }, { merge: true });
        return true;
      });
      if (changed) count++;
    }
    return count;
  }

  async findInRange(startDate: string, endDate: string): Promise<Booking[]> {
    const snapshot = await bookingsCollection.where('checkIn', '<', endDate).get();
    return snapshot.docs.map(documentToBooking).filter((b): b is Booking => !!b && isBlocking(b) && b.checkOut > startDate);
  }
}

export const bookingRepository = new BookingRepository();
