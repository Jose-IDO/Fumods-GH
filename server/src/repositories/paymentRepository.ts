import { firestore, admin } from '../config/firebaseAdmin';
import { Payment, CreatePaymentDTO, UpdatePaymentDTO } from '../types/payment.types';

const paymentsCollection = firestore.collection('payments');

function documentToPayment(doc: admin.firestore.DocumentSnapshot): Payment | null {
  if (!doc.exists) return null;
  const data = doc.data() as any;
  return {
    id: doc.id,
    bookingId: data.bookingId,
    userId: data.userId,
    amount: Number(data.amount),
    currency: data.currency,
    status: data.status,
    paymentMethod: data.paymentMethod || undefined,
    paymentReference: data.paymentReference || undefined,
    gatewayResponse: data.gatewayResponse,
    paymentDate: data.paymentDate || undefined,
    failureReason: data.failureReason || undefined,
    refundAmount: data.refundAmount !== undefined ? Number(data.refundAmount) : undefined,
    refundDate: data.refundDate || undefined,
    refundReference: data.refundReference || undefined,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  };
}

export class PaymentRepository {
  async create(dto: CreatePaymentDTO): Promise<Payment> {
    const now = admin.firestore.Timestamp.now();
    const data = {
      bookingId: dto.bookingId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency || 'ZAR',
      paymentMethod: dto.paymentMethod || null,
      paymentReference: dto.paymentReference || null,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    } as any;

    const docRef = await paymentsCollection.add(data);
    const snapshot = await docRef.get();
    return documentToPayment(snapshot)!;
  }

  async findById(id: string): Promise<Payment | null> {
    const doc = await paymentsCollection.doc(id).get();
    return documentToPayment(doc);
  }

  async findByReference(reference: string): Promise<Payment | null> {
    const snapshot = await paymentsCollection.where('paymentReference', '==', reference).limit(1).get();
    if (snapshot.empty) return null;
    return documentToPayment(snapshot.docs[0]);
  }

  async findByBookingId(bookingId: string): Promise<Payment[]> {
    const snapshot = await paymentsCollection
      .where('bookingId', '==', bookingId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(documentToPayment).filter((p): p is Payment => p !== null);
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const snapshot = await paymentsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(documentToPayment).filter((p): p is Payment => p !== null);
  }

  private async updateDocument(id: string, updates: Partial<UpdatePaymentDTO & { updatedAt: any }>): Promise<Payment | null> {
    const payload: any = { updatedAt: admin.firestore.Timestamp.now() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.paymentDate !== undefined) payload.paymentDate = updates.paymentDate;
    if (updates.failureReason !== undefined) payload.failureReason = updates.failureReason;
    if (updates.gatewayResponse !== undefined) payload.gatewayResponse = updates.gatewayResponse;

    await paymentsCollection.doc(id).update(payload);
    return this.findById(id);
  }

  async updateStatus(id: string, dto: UpdatePaymentDTO): Promise<Payment | null> {
    return this.updateDocument(id, dto);
  }

  async updateByReference(reference: string, dto: UpdatePaymentDTO): Promise<Payment | null> {
    const payment = await this.findByReference(reference);
    if (!payment) return null;
    return this.updateDocument(payment.id, dto);
  }

  async findAll(): Promise<Payment[]> {
    const snapshot = await paymentsCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(documentToPayment).filter((p): p is Payment => p !== null);
  }
}

export const paymentRepository = new PaymentRepository();
