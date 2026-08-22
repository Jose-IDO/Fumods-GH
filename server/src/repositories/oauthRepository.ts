import { firestore, admin } from '../config/firebaseAdmin';

const oauthCollection = firestore.collection('oauth_accounts');

export const oauthRepository = {
  async findByUserProvider(userId: string, provider: string) {
    const query = oauthCollection
      .where('userId', '==', userId)
      .where('provider', '==', provider)
      .limit(1);

    const snapshot = await query.get();
    return snapshot.docs[0]?.data() ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
  },

  async findByProviderUserId(provider: string, providerUserId: string) {
    const query = oauthCollection
      .where('provider', '==', provider)
      .where('providerUserId', '==', providerUserId)
      .limit(1);

    const snapshot = await query.get();
    return snapshot.docs[0]?.data() ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
  },

  async create(payload: {
    userId: string;
    provider: string;
    providerUserId: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: string | Date | null;
  }) {
    const now = admin.firestore.Timestamp.now();
    const docRef = await oauthCollection.add({
      userId: payload.userId,
      provider: payload.provider,
      providerUserId: payload.providerUserId,
      accessToken: payload.accessToken || null,
      refreshToken: payload.refreshToken || null,
      tokenExpiresAt: payload.tokenExpiresAt ? admin.firestore.Timestamp.fromDate(new Date(payload.tokenExpiresAt)) : null,
      createdAt: now,
      updatedAt: now,
    });
    const snapshot = await docRef.get();
    return { id: docRef.id, ...snapshot.data() } as any;
  },

  async updateById(id: string, updates: Partial<{ accessToken?: string; refreshToken?: string; tokenExpiresAt?: string | Date | null }>) {
    const payload: any = { updatedAt: admin.firestore.Timestamp.now() };
    if (updates.accessToken !== undefined) payload.accessToken = updates.accessToken;
    if (updates.refreshToken !== undefined) payload.refreshToken = updates.refreshToken;
    if (updates.tokenExpiresAt !== undefined) {
      payload.tokenExpiresAt = updates.tokenExpiresAt ? admin.firestore.Timestamp.fromDate(new Date(updates.tokenExpiresAt)) : null;
    }

    await oauthCollection.doc(id).update(payload);
    const snapshot = await oauthCollection.doc(id).get();
    return snapshot.data() ? { id: snapshot.id, ...snapshot.data() } : null;
  },
};
