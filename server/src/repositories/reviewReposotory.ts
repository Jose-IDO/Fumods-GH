// reviewRepository.ts
import { firestore, admin } from '../config/firebaseAdmin';
import { Review } from '../types/room.types';

const reviewsCollection = firestore.collection('reviews');

function documentToReview(doc: admin.firestore.DocumentSnapshot): Review | null {
  if (!doc.exists) return null;

  const data = doc.data();

  if (!data) return null;

  return {
    id: doc.id,
    roomId: data.roomId,
    author: data.author ?? 'Anonymous',
    comment: data.comment,
    rating: data.rating,
    timestamp:
      data.timestamp instanceof admin.firestore.Timestamp
        ? data.timestamp.toDate().toISOString()
        : data.timestamp ?? new Date().toISOString(),
  };
}

export const reviewRepository = {
  async findByRoomId(roomId: string): Promise<Review[]> {
    const snapshot = await reviewsCollection
      .where('roomId', '==', roomId)
      .get();

    return snapshot.docs
      .map((doc) => documentToReview(doc))
      .filter((review): review is Review => review !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async create(review: {
    roomId: string;
    name: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }): Promise<Review> {
    const createdAt = admin.firestore.Timestamp.fromDate(review.createdAt);

    const docRef = await reviewsCollection.add({
      roomId: review.roomId,
      author: review.name,
      comment: review.comment,
      rating: review.rating,
      timestamp: createdAt,
    });

    const snapshot = await docRef.get();
    const createdReview = documentToReview(snapshot);

    if (!createdReview) {
      throw new Error('Failed to create review');
    }

    return createdReview;
  },
};
