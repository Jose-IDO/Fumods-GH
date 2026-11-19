import { bookingRepository } from '../repositories/bookingRepository';
import { validateSelections, validateStay } from '../utils/bookingRules';
import { CreateBookingDTO, Booking } from '../types/booking.types';

export class BookingService {
  async create(userId: string, dto: CreateBookingDTO): Promise<Booking> {
    return (await this.createPending(userId, dto)).booking;
  }

  async createPending(userId: string, dto: CreateBookingDTO) {
    if (!dto.roomId || typeof dto.roomId !== 'string' || dto.roomId.includes('/')) throw new Error('Select a room');
    validateStay(dto.checkIn, dto.checkOut);
    validateSelections(dto.roomSelections, dto.roomCount);
    if (dto.requestId !== undefined && (typeof dto.requestId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(dto.requestId))) throw new Error('Invalid booking request');
    const selections = dto.roomSelections.map(r => ({ bedType: r.bedType, adults: r.adults, babies: r.babies }));
    const booking = await bookingRepository.reserve(userId, { ...dto, roomSelections: selections });
    return { booking, payment: { reference: booking.paymentReference } };
  }

  async confirmByPaymentRef(paymentRef: string) {
    const updated = await bookingRepository.confirmByPaymentRef(paymentRef);
    if (!updated) throw new Error('Booking not found for payment reference');
    return updated;
  }

  async cancelExpiredPendings() {
    return bookingRepository.cancelExpiredPendings(new Date().toISOString());
  }

  async myBookings(
    userId: string,
    options?: {
      status?: Array<'pending'|'confirmed'|'cancelled'>;
      start?: string;
      end?: string;
      limit?: number;
      page?: number;
    }
  ) {
    const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
    const page = Math.max(1, options?.page ?? 1);
    const offset = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      bookingRepository.findByUserFiltered(userId, {
        status: options?.status,
        start: options?.start,
        end: options?.end,
        limit,
        offset,
      }),
      bookingRepository.countByUserFiltered(userId, {
        status: options?.status,
        start: options?.start,
        end: options?.end,
      })
    ]);

    return {
      rows,
      paging: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  }

  async cancelBooking(bookingId: string, userId: string) {
    // Verify the booking belongs to the user
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== userId) throw new Error('Unauthorized');
    if (booking.status === 'cancelled') throw new Error('Booking already cancelled');
    
    // Update status to cancelled
    return bookingRepository.updateStatus(bookingId, 'cancelled');
  }

  async listAll() {
    return bookingRepository.findAll();
  }

  async updateStatus(id: string, status: 'pending'|'confirmed'|'cancelled') {
    return bookingRepository.updateStatus(id, status);
  }
}

export const bookingService = new BookingService();