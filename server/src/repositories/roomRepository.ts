import { firestore, admin } from '../config/firebaseAdmin';
import { Room, RoomPayload } from '../types/room.types';

const roomsCollection = firestore.collection('rooms');

function documentToRoom(doc: admin.firestore.DocumentSnapshot): Room | null {
  if (!doc.exists) return null;
  const data = doc.data() as any;
  return {
    id: doc.id,
    roomName: data.roomName,
    roomType: data.roomType,
    price: Number(data.price),
    maxGuests: data.maxGuests,
    bedType: data.bedType,
    numberOfBeds: data.numberOfBeds,
    roomSizeSqm: Number(data.roomSizeSqm),
    amenities: data.amenities || [],
    units: data.units || [],
    status: data.status || 'active',
    images: data.images || [],
  };
}

class RoomRepository {
  async findAll(status?: 'active' | 'archived'): Promise<Room[]> {
    let query: admin.firestore.Query = roomsCollection.orderBy('createdAt', 'desc');
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(documentToRoom).filter((room): room is Room => room !== null);
  }

  async findById(id: string): Promise<Room | null> {
    const doc = await roomsCollection.doc(id).get();
    return documentToRoom(doc);
  }

  async create(payload: RoomPayload): Promise<Room> {
    const now = admin.firestore.Timestamp.now();
    const data = {
      roomName: payload.roomName,
      roomType: payload.roomType,
      price: payload.price,
      maxGuests: payload.maxGuests ?? 1,
      bedType: payload.bedType ?? 'unknown',
      numberOfBeds: payload.numberOfBeds ?? 1,
      roomSizeSqm: payload.roomSizeSqm ?? 0,
      amenities: payload.amenities ?? [],
      units: payload.units ?? [],
      status: 'active',
      images: [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await roomsCollection.add(data);
    const snapshot = await docRef.get();
    return documentToRoom(snapshot)!;
  }

  async update(id: string, updates: Partial<RoomPayload>): Promise<Room | null> {
    const payload: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (updates.roomName !== undefined) payload.roomName = updates.roomName;
    if (updates.roomType !== undefined) payload.roomType = updates.roomType;
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.maxGuests !== undefined) payload.maxGuests = updates.maxGuests;
    if (updates.bedType !== undefined) payload.bedType = updates.bedType;
    if (updates.numberOfBeds !== undefined) payload.numberOfBeds = updates.numberOfBeds;
    if (updates.roomSizeSqm !== undefined) payload.roomSizeSqm = Number(updates.roomSizeSqm);
    if (updates.amenities !== undefined) payload.amenities = updates.amenities;
    if (updates.units !== undefined) payload.units = updates.units;

    if (Object.keys(payload).length === 1) {
      return this.findById(id);
    }

    await roomsCollection.doc(id).update(payload);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await roomsCollection.doc(id).delete();
    return true;
  }

  async archive(id: string): Promise<Room | null> {
    await roomsCollection.doc(id).update({
      status: 'archived',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(id);
  }

  async restore(id: string): Promise<Room | null> {
    await roomsCollection.doc(id).update({
      status: 'active',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(id);
  }

  async updateImages(roomId: string, images: string[]): Promise<Room | null> {
    await roomsCollection.doc(roomId).update({
      images,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(roomId);
  }

  async addImages(roomId: string, imagePaths: string[]): Promise<Room | null> {
    await roomsCollection.doc(roomId).update({
      images: admin.firestore.FieldValue.arrayUnion(...imagePaths),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(roomId);
  }

  async removeImage(roomId: string, imagePath: string): Promise<Room | null> {
    await roomsCollection.doc(roomId).update({
      images: admin.firestore.FieldValue.arrayRemove(imagePath),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return this.findById(roomId);
  }
}

export const roomRepository = new RoomRepository();
