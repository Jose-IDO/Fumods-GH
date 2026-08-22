export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;   // ISO date
  checkOut: string;  // ISO date
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  paymentReference?: string;
  expiresAt?: string;
  roomCount: number;
  createdAt: string;
  confirmationEmailSentAt?: string;
}

export interface CreateBookingDTO {
  roomId: string;
  checkIn: string;  // ISO date (YYYY-MM-DD)
  checkOut: string; // ISO date (YYYY-MM-DD)
  guests: number;
  roomCount: number;
  guestDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    phone: string;
    adults: number;
    children: number;
  };
}
