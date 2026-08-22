import { firestore, admin } from '../config/firebaseAdmin';

export type NotificationType = 'booking_confirmation' | 'booking_update' | 'promotion' | 'general';

const notificationsCollection = firestore.collection('notifications');

export const notificationRepository = {
  async create(userId: string, message: string, bookingId?: string, type: NotificationType = 'general') {
    const now = admin.firestore.Timestamp.now();
    const docRef = await notificationsCollection.add({
      userId,
      message,
      bookingId: bookingId || null,
      type,
      read: false,
      createdAt: now,
      updatedAt: now,
    });
    const snapshot = await docRef.get();
    return { id: docRef.id, ...snapshot.data() };
  },

  async getAllCustomerIds() {
    const userSnapshot = await firestore.collection('users')
      .where('roleNames', 'array-contains', 'customer')
      .get();
    return userSnapshot.docs.map(doc => doc.id);
  },

  async createBulk(userIds: string[], message: string, type: NotificationType = 'promotion') {
    const chunks: Array<Promise<any[]>> = [];
    const maxBatchSize = 400;

    for (let i = 0; i < userIds.length; i += maxBatchSize) {
      const batch = firestore.batch();
      const slice = userIds.slice(i, i + maxBatchSize);
      const batchResults: any[] = [];

      slice.forEach(userId => {
        const docRef = notificationsCollection.doc();
        batch.set(docRef, {
          userId,
          message,
          type,
          read: false,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
        batchResults.push({ id: docRef.id, userId, message, type, read: false });
      });

      chunks.push(batch.commit().then(() => batchResults));
    }

    return (await Promise.all(chunks)).flat();
  },

  async getUserNotifications(userId: string) {
    const snapshot = await notificationsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async markAsRead(id: string, userId: string) {
    const docRef = notificationsCollection.doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return null;

    const data = snapshot.data();
    if (!data || data.userId !== userId) {
      return null;
    }

    await docRef.update({ read: true, updatedAt: admin.firestore.Timestamp.now() });
    const updatedSnapshot = await docRef.get();
    return { id: docRef.id, ...updatedSnapshot.data() };
  },

  async deleteByBookingId(bookingId: string) {
    const snapshot = await notificationsCollection.where('bookingId', '==', bookingId).get();
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};
