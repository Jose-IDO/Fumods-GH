import { firestore, admin } from '../config/firebaseAdmin';
import { User } from '../types/user.types';
import { normalizeKeywords } from './firestoreHelpers';

const usersCollection = firestore.collection('users');

function documentToUser(doc: admin.firestore.DocumentSnapshot): (User & { passwordHash?: string }) | null {
  if (!doc.exists) return null;
  const data = doc.data() as any;
  return {
    id: doc.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || undefined,
    profileImageUrl: data.profileImageUrl || undefined,
    emailVerified: data.emailVerified ?? false,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    lastLoginAt: data.lastLoginAt ? (data.lastLoginAt.toDate ? data.lastLoginAt.toDate() : new Date(data.lastLoginAt)) : undefined,
    roles: data.roles || [],
    passwordHash: data.passwordHash,
  };
}

export class UserRepository {
  async findAll(search?: string, limit = 50, offset = 0): Promise<User[]> {
    let query: admin.firestore.Query = usersCollection.orderBy('createdAt', 'desc').limit(limit);

    if (search && search.trim()) {
      const terms = normalizeKeywords(search);
      query = query.where('searchKeywords', 'array-contains-any', terms);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(documentToUser).filter((u): u is User => u !== null);

    if (offset > 0) {
      return users.slice(offset, offset + limit);
    }

    return users;
  }

  async findByEmail(email: string): Promise<(User & { passwordHash?: string }) | null> {
    const snapshot = await usersCollection.where('email', '==', email.toLowerCase()).limit(1).get();
    if (snapshot.empty) return null;
    return documentToUser(snapshot.docs[0]);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await usersCollection.doc(id).get();
    const user = documentToUser(doc);
    if (!user) return null;
    delete (user as any).passwordHash;
    return user;
  }

  async create(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    roles?: Array<{ name: string; displayName: string; isSystemRole: boolean }>;
    roleNames?: string[];
    emailVerified?: boolean;
  }): Promise<User> {
    const now = admin.firestore.Timestamp.now();
    const roles = userData.roles ?? [
      { name: 'customer', displayName: 'Customer', isSystemRole: true }
    ];
    const roleNames = userData.roleNames ?? ['customer'];
    const emailVerified = userData.emailVerified ?? false;

    const data = {
      email: userData.email.toLowerCase(),
      passwordHash: userData.passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      profileImageUrl: null,
      emailVerified,
      isActive: true,
      roles,
      roleNames,
      searchKeywords: normalizeKeywords(userData.email, userData.firstName, userData.lastName),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const docRef = await usersCollection.add(data);
    const snapshot = await docRef.get();
    const user = documentToUser(snapshot);
    if (!user) throw new Error('Failed to create user');
    delete (user as any).passwordHash;
    return user;
  }

  async updateRoles(userId: string, roles: Array<{ name: string; displayName: string; isSystemRole: boolean }>, roleNames: string[]): Promise<void> {
    await usersCollection.doc(userId).update({
      roles,
      roleNames,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await usersCollection.doc(userId).update({
      lastLoginAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  async updateIsActive(userId: string, isActive: boolean): Promise<void> {
    await usersCollection.doc(userId).update({
      isActive,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  async findAdmins(): Promise<User[]> {
    const snapshot = await usersCollection
      .where('roleNames', 'array-contains-any', ['super_admin', 'hotel_manager', 'support_agent'])
      .get();

    return snapshot.docs
      .map(documentToUser)
      .filter((u): u is User => u !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((user) => {
        delete (user as any).passwordHash;
        return user;
      });
  }

  async findCustomers(): Promise<User[]> {
    const snapshot = await usersCollection
      .where('roleNames', 'array-contains', 'customer')
      .get();

    return snapshot.docs
      .map(documentToUser)
      .filter((u): u is User => u !== null)
      .map((user) => {
        delete (user as any).passwordHash;
        return user;
      });
  }

  async updateProfile(userId: string, fields: { firstName?: string; lastName?: string; phone?: string | null; profileImageUrl?: string | null; }): Promise<User | null> {
    const updates: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (fields.firstName !== undefined) updates.firstName = fields.firstName;
    if (fields.lastName !== undefined) updates.lastName = fields.lastName;
    if (fields.phone !== undefined) updates.phone = fields.phone;
    if (fields.profileImageUrl !== undefined) updates.profileImageUrl = fields.profileImageUrl;

    if (fields.firstName || fields.lastName) {
      updates.searchKeywords = normalizeKeywords(fields.firstName || '', fields.lastName || '');
    }

    await usersCollection.doc(userId).update(updates);
    return this.findById(userId);
  }

  async updateEmailVerified(userId: string, isVerified: boolean): Promise<void> {
    await usersCollection.doc(userId).update({
      emailVerified: isVerified,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  async getPasswordHashById(userId: string): Promise<string | null> {
    const doc = await usersCollection.doc(userId).get();
    return doc.data()?.passwordHash || null;
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await usersCollection.doc(userId).update({
      passwordHash,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }
}

export const userRepository = new UserRepository();
