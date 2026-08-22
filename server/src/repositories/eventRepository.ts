import { firestore, admin } from '../config/firebaseAdmin';
import { EventInput } from '../types/event';

const eventsCollection = firestore.collection('events');

interface EventDocument {
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

function documentToEvent(doc: admin.firestore.DocumentSnapshot): (EventInput & { id: string; createdAt: string }) | null {
  if (!doc.exists) return null;
  const data = doc.data() as EventDocument;

  return {
    id: doc.id,
    title: data.title,
    date: data.date,
    description: data.description,
    imageUrl: data.imageUrl,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export const eventRepository = {
  findAll: async () => {
    const snapshot = await eventsCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs
      .map(documentToEvent)
      .filter((event): event is EventInput & { id: string; createdAt: string } => event !== null);
  },

  findById: async (id: string) => {
    const doc = await eventsCollection.doc(id).get();
    return documentToEvent(doc);
  },

  create: async (event: EventInput) => {
    const now = admin.firestore.Timestamp.now();
    const data: EventDocument = {
      title: event.title,
      date: event.date,
      description: event.description,
      imageUrl: event.imageUrl,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await eventsCollection.add(data);
    const snapshot = await docRef.get();
    return documentToEvent(snapshot)!;
  },

  update: async (id: string, updates: Partial<EventInput>) => {
    const payload: Partial<EventDocument> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.imageUrl !== undefined) payload.imageUrl = updates.imageUrl;
    if (Object.keys(payload).length === 0) {
      return await eventRepository.findById(id);
    }
    payload.updatedAt = admin.firestore.Timestamp.now();
    await eventsCollection.doc(id).update(payload);
    return eventRepository.findById(id);
  },

  delete: async (id: string) => {
    await eventsCollection.doc(id).delete();
  },
};
