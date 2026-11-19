import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Customer
router.post('/', authenticate, bookingController.create);
router.get('/me', authenticate, bookingController.myBookings);
router.get('/my-bookings', authenticate, bookingController.myBookings);
router.get('/by-reference/:reference', authenticate, bookingController.getByReference);
router.patch('/:id/cancel', authenticate, bookingController.cancelBooking);

// Public - booked dates (for date pickers / availability views)
router.get('/booked-dates', bookingController.bookedDates);
router.get('/availability', bookingController.publicAvailability);
// Safe, idempotent cleanup: only already-expired pending bookings can change.
router.get('/expire', bookingController.expire);

// Admin
router.get('/admin', authenticate, requireRole(['super_admin','hotel_manager']), bookingController.listAll);
router.patch('/:id/status', authenticate, requireRole(['super_admin','hotel_manager']), bookingController.updateStatus);
router.get('/admin/availability', authenticate, requireRole(['super_admin','hotel_manager']), bookingController.availability);


export default router;
