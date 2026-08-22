import { firestore, admin } from '../config/firebaseAdmin';
import { Booking } from '../types/booking.types';

const bookingsCollection = firestore.collection('bookings');

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
    status: data.status,
    paymentReference: data.paymentReference || undefined,
    expiresAt: data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate().toISOString() : new Date(data.expiresAt).toISOString()) : undefined,
    roomCount: data.roomCount ?? 1,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    confirmationEmailSentAt: data.confirmationEmailSentAt?.toDate ? data.confirmationEmailSentAt.toDate().toISOString() : data.confirmationEmailSentAt,
  };
}

export class BookingRepository {
  async countRoomUnits(roomId: string): Promise<number> {
    const roomDoc = await firestore.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) return 0;
    const roomData = roomDoc.data() as any;
    return Array.isArray(roomData?.units) ? roomData.units.length : 0;
  }

  async countOverlappingBookings(roomId: string, checkIn: string, checkOut: string): Promise<number> {
    const snapshot = await bookingsCollection
      .where('roomId', '==', roomId)
      .where('status', 'in', ['pending', 'confirmed'])
      .where('checkIn', '<', checkOut)
      .get();

    return snapshot.docs.reduce((count, doc) => {
      const data = doc.data();
      const existingCheckIn = new Date(data.checkIn);
      const existingCheckOut = new Date(data.checkOut);
      if (existingCheckIn < new Date(checkOut) && new Date(checkIn) < existingCheckOut) return count + 1;
      return count;
    }, 0);
  }

  async create(userId: string, roomId: string, checkIn: string, checkOut: string, guests: number, totalPrice: number, roomCount: number = 1): Promise<Booking> {
    const now = admin.firestore.Timestamp.now();
    const docRef = await bookingsCollection.add({
      userId,
      roomId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      status: 'confirmed',
      roomCount,
      createdAt: now,
      updatedAt: now,
    });
    const snapshot = await docRef.get();
    return documentToBooking(snapshot)!;
  }

  async createPending(
    userId: string,
    roomId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    totalPrice: number,
    paymentRef: string | null,
    expiresAt: string,
    roomCount: number = 1
  ): Promise<Booking> {
    const now = admin.firestore.Timestamp.now();
    const docRef = await bookingsCollection.add({
      userId,
      roomId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      status: 'pending',
      paymentReference: paymentRef,
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(expiresAt)),
      roomCount,
      createdAt: now,
      updatedAt: now,
    });
    const snapshot = await docRef.get();
    return documentToBooking(snapshot)!;
  }

  async findByUser(userId: string): Promise<Booking[]> {
    const snapshot = await bookingsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(documentToBooking).filter((b): b is Booking => b !== null);
  }

  async findByUserFiltered(
    userId: string,
    options: {
      status?: Array<'pending' | 'confirmed' | 'cancelled'>;
      start?: string;
      end?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Booking[]> {
    let query: admin.firestore.Query = bookingsCollection.where('userId', '==', userId);

    if (options.status && options.status.length) {
      query = query.where('status', 'in', options.status);
    }

    if (options.start) {
      query = query.where('checkOut', '>', options.start);
    }
    if (options.end) {
      query = query.where('checkIn', '<', options.end);
    }

    query = query.orderBy('createdAt', 'desc').limit(options.limit ?? 20);
    const snapshot = await query.get();
    let bookings = snapshot.docs.map(documentToBooking).filter((b): b is Booking => b !== null);

    if (options.start) {
      bookings = bookings.filter(b => new Date(b.checkOut) > new Date(options.start!));
    }
    if (options.end) {
      bookings = bookings.filter(b => new Date(b.checkIn) < new Date(options.end!));
    }

    const offset = options.offset ?? 0;
    return offset > 0 ? bookings.slice(offset, offset + (options.limit ?? 20)) : bookings;
  }

  async countByUserFiltered(
    userId: string,
    options: {
      status?: Array<'pending' | 'confirmed' | 'cancelled'>;
      start?: string;
      end?: string;
    }
  ): Promise<number> {
    let query: admin.firestore.Query = bookingsCollection.where('userId', '==', userId);

    if (options.status && options.status.length) {
      query = query.where('status', 'in', options.status);
    }

    if (options.start) {
      query = query.where('checkOut', '>', options.start);
    }
    if (options.end) {
      query = query.where('checkIn', '<', options.end);
    }

    const snapshot = await query.get();
    const bookings = snapshot.docs.map(documentToBooking).filter((b): b is Booking => b !== null);
    return bookings.length;
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
    await bookingsCollection.doc(id).update({
      status,
      updatedAt: admin.firestore.Timestamp.now(),
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
    await bookingsCollection.doc(booking.id).update({
      status: 'confirmed',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(booking.id);
  }

  async markConfirmationEmailSent(id: string): Promise<void> {
    await bookingsCollection.doc(id).update({
      confirmationEmailSentAt: admin.firestore.Timestamp.now(),
    });
  }

  async cancelExpiredPendings(nowIso: string): Promise<number> {
    const snapshot = await bookingsCollection
      .where('status', '==', 'pending')
      .where('expiresAt', '<=', admin.firestore.Timestamp.fromDate(new Date(nowIso)))
      .get();
    if (snapshot.empty) return 0;

    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'cancelled',
        updatedAt: admin.firestore.Timestamp.now(),
      });
    });
    await batch.commit();
    return snapshot.size;
  }

  async findInRange(startDate: string, endDate: string): Promise<Array<{ roomId: string; checkIn: string; checkOut: string; status: string; roomCount: number }>> {
    const snapshot = await bookingsCollection
      .where('status', 'in', ['pending', 'confirmed'])
      .where('checkIn', '<', endDate)
      .get();

    return snapshot.docs
      .map(doc => {
        const data = doc.data() as any;
        return {
          roomId: data.roomId,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          status: data.status,
          roomCount: data.roomCount ?? 1,
        };
      })
      .filter((booking) => {
        const ci = new Date(booking.checkIn);
        const co = new Date(booking.checkOut);
        return ci < new Date(endDate) && new Date(startDate) < co;
      });
  }
}

export const bookingRepository = new BookingRepository();
