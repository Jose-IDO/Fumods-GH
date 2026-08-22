import { Router } from 'express';
import express from 'express';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth';
import { bookingRepository } from '../repositories/bookingRepository';
import { userRepository } from '../repositories/userRepository';
import { bookingService } from '../services/bookingService';
import { paymentRepository } from '../repositories/paymentRepository';
import { paymentController } from '../controllers/paymentController';
import { roomRepository } from '../repositories/roomRepository';
import { emailService } from '../services/emailService';

const router = Router();

async function sendBookingConfirmationEmail(booking: Awaited<ReturnType<typeof bookingService.confirmByPaymentRef>>) {
  if (!booking || booking.confirmationEmailSentAt) return;

  try {
    const [user, room] = await Promise.all([
      userRepository.findById(booking.userId),
      roomRepository.findById(booking.roomId),
    ]);
    if (!user) return;

    const sent = await emailService.sendBookingConfirmationEmail({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      bookingId: booking.id,
      roomName: room?.roomName || room?.roomType || 'Your room',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalPrice: booking.totalPrice,
    });
    if (sent) await bookingRepository.markConfirmationEmailSent(booking.id);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
  }
}

// POST /payments/paystack/start
router.post('/paystack/start', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body as { bookingId: string };
    if (!bookingId) return res.status(400).json({ ok: false, error: 'Missing bookingId' });

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) return res.status(404).json({ ok: false, error: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ ok: false, error: 'Booking is not pending' });
    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      return res.status(400).json({ ok: false, error: 'Booking has expired' });
    }

    const user = await userRepository.findById(booking.userId);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const subtotal = Number(booking.totalPrice);
    const grandTotal = subtotal;

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ ok: false, error: 'PAYSTACK_SECRET_KEY not configured' });
    }

    const amountMinor = Math.round(grandTotal * 100);
    const reference = booking.paymentReference || `bk_${booking.id}`;

    // Persist reference on booking if not already set
    if (!booking.paymentReference || booking.paymentReference !== reference) {
      await bookingRepository.updatePaymentReference(booking.id, reference);
    }

    const payment = await paymentRepository.create({
      bookingId: booking.id,
      userId: booking.userId,
      amount: grandTotal,
      currency: 'ZAR',
      paymentMethod: 'paystack',
      paymentReference: reference,
    });

    const callbackUrl = `${PUBLIC_BASE_URL}/booking-confirmation?ref=${encodeURIComponent(reference)}&reference=${encodeURIComponent(reference)}`;

    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountMinor,
        currency: 'ZAR',
        reference,
        callback_url: callbackUrl,
        metadata: {
          bookingId: booking.id,
          userId: booking.userId,
        },
      }),
    } as any);

    if (!initRes.ok) {
      const text = await initRes.text();
      return res.status(400).json({ ok: false, error: `Paystack init failed: ${text}` });
    }

    const data = await initRes.json();
    const authorizationUrl = data?.data?.authorization_url;
    const accessCode = data?.data?.access_code;

    if (!authorizationUrl) {
      return res.status(400).json({ ok: false, error: 'Missing authorization_url from Paystack' });
    }

    return res.json({ ok: true, data: { checkoutUrl: authorizationUrl, reference, accessCode } });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /payments/paystack/webhook
router.post('/paystack/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const signature = req.headers['x-paystack-signature'] as string;
    const body = req.body as Buffer;

    if (!signature) return res.status(400).send('Missing signature');

    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
    if (hash !== signature) return res.status(400).send('Invalid signature');

    const event = JSON.parse(body.toString());
    const reference = event?.data?.reference as string | undefined;

    if (event?.event === 'charge.success' && reference) {
      // Update payment record to success
      await paymentRepository.updateByReference(reference, {
        status: 'success',
        paymentDate: new Date().toISOString(),
        gatewayResponse: event.data,
      });

      // Confirm booking
      const confirmed = await bookingService.confirmByPaymentRef(reference);
      await sendBookingConfirmationEmail(confirmed);
    }

    res.status(200).send('ok');
  } catch (e: any) {
    res.status(400).send('webhook error');
  }
});

router.get('/paystack/verify', authenticate, async (req, res) => {
  try {
    const reference = (req.query.reference as string) || (req.query.ref as string);
    if (!reference) return res.status(400).json({ ok: false, error: 'Missing reference' });

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ ok: false, error: 'PAYSTACK_SECRET_KEY not configured' });
    }

    // Verify transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
    } as any);

    const body = await verifyRes.text();
    if (!verifyRes.ok) {
      return res.status(400).json({ ok: false, error: `Verify failed: ${body}` });
    }

    const payload = JSON.parse(body);
    const status = payload?.data?.status;

    if (status === 'success') {
      // Update payment record
      await paymentRepository.updateByReference(reference, {
        status: 'success',
        paymentDate: new Date().toISOString(),
        gatewayResponse: payload.data,
      });

      // Confirm booking by reference (idempotent)
      const confirmed = await bookingService.confirmByPaymentRef(reference);
      await sendBookingConfirmationEmail(confirmed);
      return res.json({ ok: true, data: { verified: true, booking: confirmed } });
    }

    return res.json({ ok: true, data: { verified: false, status } });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Customer routes
router.get('/me', authenticate, paymentController.myPayments);
router.get('/:id', authenticate, paymentController.getById);
router.get('/booking/:bookingId', authenticate, paymentController.getByBookingId);

// Admin routes
router.get('/admin/all', authenticate, requireRole(['super_admin', 'hotel_manager']), paymentController.listAll);

export default router;
