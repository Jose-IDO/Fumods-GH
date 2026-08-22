import { firestore, admin } from '../config/firebaseAdmin';
import { Deal, DealPayload, DealWithRoom } from '../types/deal.types';

const dealsCollection = firestore.collection('deals');
const roomsCollection = firestore.collection('rooms');

function timestampFromDate(date: Date) {
  return admin.firestore.Timestamp.fromDate(date);
}

function documentToDeal(doc: admin.firestore.DocumentSnapshot): Deal | null {
  if (!doc.exists) return null;
  const data = doc.data() as any;
  return {
    id: Number(data.id ?? doc.id),
    roomId: data.roomId,
    title: data.title,
    description: data.description ?? null,
    discountPercentage: data.discountPercentage,
    startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
    endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
    isActive: data.isActive,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

async function getDealDocById(id: number) {
  const querySnapshot = await dealsCollection.where('id', '==', id).limit(1).get();
  return querySnapshot.empty ? null : querySnapshot.docs[0];
}

async function hydrateDealWithRoom(deal: Deal): Promise<DealWithRoom> {
  const roomSnapshot = await roomsCollection.doc(deal.roomId).get();
  const roomData = roomSnapshot.exists ? (roomSnapshot.data() as any) : null;
  const originalPrice = Number(roomData?.price ?? 0);
  const discountPercentage = deal.discountPercentage;

  return {
    ...deal,
    roomName: roomData?.roomName ?? '',
    roomType: roomData?.roomType ?? '',
    originalPrice,
    discountedPrice: originalPrice * (1 - discountPercentage / 100),
    images: roomData?.images ?? [],
    maxGuests: roomData?.maxGuests ?? 0,
    bedType: roomData?.bedType ?? '',
  };
}

export const dealRepository = {
  async createDeal(payload: DealPayload): Promise<Deal> {
    const now = admin.firestore.Timestamp.now();
    const id = Date.now();
    const docRef = dealsCollection.doc();
    await docRef.set({
      id,
      roomId: payload.roomId,
      title: payload.title,
      description: payload.description ?? null,
      discountPercentage: payload.discountPercentage,
      startDate: timestampFromDate(payload.startDate),
      endDate: timestampFromDate(payload.endDate),
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdAt: now,
      updatedAt: now,
    });
    const snapshot = await docRef.get();
    return documentToDeal(snapshot)!;
  },

  async getAllDeals(): Promise<DealWithRoom[]> {
    const snapshot = await dealsCollection.orderBy('createdAt', 'desc').get();
    const deals = snapshot.docs
      .map(documentToDeal)
      .filter((deal): deal is Deal => deal !== null);
    return Promise.all(deals.map(hydrateDealWithRoom));
  },

  async getActiveDeals(): Promise<DealWithRoom[]> {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await dealsCollection
      .where('isActive', '==', true)
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .orderBy('startDate')
      .get();
    const deals = snapshot.docs
      .map(documentToDeal)
      .filter((deal): deal is Deal => deal !== null);
    return Promise.all(deals.map(hydrateDealWithRoom));
  },

  async getDealById(id: number): Promise<DealWithRoom | null> {
    const doc = await getDealDocById(id);
    if (!doc) return null;
    const deal = documentToDeal(doc);
    return deal ? hydrateDealWithRoom(deal) : null;
  },

  async updateDeal(id: number, payload: Partial<DealPayload>): Promise<Deal | null> {
    const doc = await getDealDocById(id);
    if (!doc) return null;
    const updatePayload: any = { updatedAt: admin.firestore.Timestamp.now() };
    if (payload.roomId !== undefined) updatePayload.roomId = payload.roomId;
    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.discountPercentage !== undefined) updatePayload.discountPercentage = payload.discountPercentage;
    if (payload.startDate !== undefined) updatePayload.startDate = timestampFromDate(payload.startDate);
    if (payload.endDate !== undefined) updatePayload.endDate = timestampFromDate(payload.endDate);
    if (payload.isActive !== undefined) updatePayload.isActive = payload.isActive;
    await doc.ref.update(updatePayload);
    const updatedSnapshot = await doc.ref.get();
    return documentToDeal(updatedSnapshot);
  },

  async toggleDealActive(id: number): Promise<Deal | null> {
    const doc = await getDealDocById(id);
    if (!doc) return null;
    const current = doc.data()?.isActive;
    await doc.ref.update({
      isActive: !current,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return documentToDeal(await doc.ref.get());
  },

  async deleteDeal(id: number): Promise<boolean> {
    const doc = await getDealDocById(id);
    if (!doc) return false;
    await doc.ref.delete();
    return true;
  },
};
