import { firestore, admin } from '../config/firebaseAdmin';
import { HotelSettings, UpdateHotelSettingsDTO } from '../types/hotelSettings.types';

const SETTINGS_DOC_ID = 'hotel_settings';
const settingsCollection = firestore.collection('hotelSettings');

function documentToSettings(doc: admin.firestore.DocumentSnapshot): HotelSettings {
  if (!doc.exists) throw new Error('Hotel settings not found');
  const data = doc.data() as any;
  return {
    id: doc.id,
    hotelName: data.hotelName,
    tagline: data.tagline,
    description: data.description,
    email: data.email,
    phone: data.phone,
    website: data.website,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    stateProvince: data.stateProvince,
    postalCode: data.postalCode,
    country: data.country,
    checkInTime: data.checkInTime,
    checkOutTime: data.checkOutTime,
    facebookUrl: data.facebookUrl,
    instagramUrl: data.instagramUrl,
    twitterUrl: data.twitterUrl,
    amenities: data.amenities || [],
    logoUrl: data.logoUrl,
    heroImageUrl: data.heroImageUrl,
    galleryImages: data.galleryImages || [],
    taxRate: data.taxRate !== undefined ? Number(data.taxRate) : 15,
    currency: data.currency,
    cancellationPolicy: data.cancellationPolicy,
    termsAndConditions: data.termsAndConditions,
    faqs: Array.isArray(data.faqs) ? data.faqs : undefined,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  };
}

export class HotelSettingsRepository {
  async get(): Promise<HotelSettings> {
    const docRef = settingsCollection.doc(SETTINGS_DOC_ID);
    let doc = await docRef.get();
    if (!doc.exists) {
      const now = admin.firestore.Timestamp.now();
      await docRef.set({
        hotelName: 'Fumods Guesthouse',
        phone: '084 229 8842 / 084 451 0707',
        addressLine1: 'Fumods Guesthouse',
        country: 'South Africa',
        checkInTime: '14:00',
        checkOutTime: '10:00',
        currency: 'ZAR',
        faqs: undefined,
        createdAt: now,
        updatedAt: now,
      });
      doc = await docRef.get();
    }
    return documentToSettings(doc);
  }

  async update(dto: UpdateHotelSettingsDTO): Promise<HotelSettings> {
    const updates: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (dto.hotelName !== undefined) updates.hotelName = dto.hotelName;
    if (dto.tagline !== undefined) updates.tagline = dto.tagline;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.website !== undefined) updates.website = dto.website;
    if (dto.addressLine1 !== undefined) updates.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updates.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updates.city = dto.city;
    if (dto.stateProvince !== undefined) updates.stateProvince = dto.stateProvince;
    if (dto.postalCode !== undefined) updates.postalCode = dto.postalCode;
    if (dto.country !== undefined) updates.country = dto.country;
    if (dto.checkInTime !== undefined) updates.checkInTime = dto.checkInTime;
    if (dto.checkOutTime !== undefined) updates.checkOutTime = dto.checkOutTime;
    if (dto.facebookUrl !== undefined) updates.facebookUrl = dto.facebookUrl;
    if (dto.instagramUrl !== undefined) updates.instagramUrl = dto.instagramUrl;
    if (dto.twitterUrl !== undefined) updates.twitterUrl = dto.twitterUrl;
    if (dto.amenities !== undefined) updates.amenities = dto.amenities;
    if (dto.logoUrl !== undefined) updates.logoUrl = dto.logoUrl;
    if (dto.heroImageUrl !== undefined) updates.heroImageUrl = dto.heroImageUrl;
    if (dto.galleryImages !== undefined) updates.galleryImages = dto.galleryImages;
    if (dto.taxRate !== undefined) updates.taxRate = dto.taxRate;
    if (dto.currency !== undefined) updates.currency = dto.currency;
    if (dto.cancellationPolicy !== undefined) updates.cancellationPolicy = dto.cancellationPolicy;
    if (dto.termsAndConditions !== undefined) updates.termsAndConditions = dto.termsAndConditions;
    if (dto.faqs !== undefined) updates.faqs = dto.faqs;

    const docRef = settingsCollection.doc(SETTINGS_DOC_ID);
    await docRef.set(updates, { merge: true });
    const snapshot = await docRef.get();
    return documentToSettings(snapshot);
  }
}

export const hotelSettingsRepository = new HotelSettingsRepository();
