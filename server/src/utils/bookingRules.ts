export const TOTAL_ROOMS = 5;
export const HOLD_MS = 48 * 60 * 60 * 1000;
export interface RoomSelection { bedType: 'double' | 'twin'; adults: number; babies: number }
export interface Reservation {
  id?: string; checkIn: string; checkOut: string; status: string;
  expiresAt?: string; roomCount?: number; physicalRoomIds?: number[];
}

export function validateStay(checkIn: string, checkOut: string, now = Date.now()) {
  const valid = (value: string) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(checkIn) || !valid(checkOut)) throw new Error('Choose valid check-in and check-out dates');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  if (checkIn < today) throw new Error('Check-in cannot be in the past');
  if (checkOut <= checkIn) throw new Error('Check-out must be after check-in');
  if ((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 > 365) throw new Error('Maximum stay is 365 nights');
}

export function validateSelections(selections: RoomSelection[], count: number) {
  if (!Number.isInteger(count) || count < 1 || count > TOTAL_ROOMS) throw new Error('Choose between 1 and 5 rooms');
  if (!Array.isArray(selections) || selections.length !== count) throw new Error('Choose beds and occupancy for every room');
  for (const room of selections) {
    if (!room || !['double', 'twin'].includes(room.bedType)) throw new Error('Choose a double bed or two single beds for each room');
    if (!Number.isInteger(room.adults) || room.adults < 1 || room.adults > 2 || !Number.isInteger(room.babies) || room.babies < 0 || room.babies > 1) {
      throw new Error('Each room allows 1–2 adults and at most 1 baby');
    }
  }
}

export function isBlocking(booking: Reservation, now = Date.now()) {
  return booking.status === 'confirmed' || (booking.status === 'pending' && !!booking.expiresAt && Date.parse(booking.expiresAt) > now);
}
export function overlaps(a: Pick<Reservation, 'checkIn' | 'checkOut'>, b: Pick<Reservation, 'checkIn' | 'checkOut'>) {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

// New reservations keep the same physical rooms throughout the stay. Legacy bookings
// without room IDs still consume capacity, across every catalogue listing.
export function freeRooms(bookings: Reservation[], checkIn: string, checkOut: string, now = Date.now()) {
  const active = bookings.filter(b => isBlocking(b, now) && overlaps(b, { checkIn, checkOut }));
  const occupied = new Set(active.flatMap(b => b.physicalRoomIds || []));
  const legacy = active.filter(b => !b.physicalRoomIds?.length);
  // Adjacent legacy stays reuse capacity; do not sum separate nights together.
  let legacyCount = 0;
  for (const day of [checkIn, ...legacy.map(b => b.checkIn).filter(day => day >= checkIn && day < checkOut)]) {
    legacyCount = Math.max(legacyCount, legacy.filter(b => b.checkIn <= day && day < b.checkOut).reduce((sum, b) => sum + Math.max(1, b.roomCount || 1), 0));
  }
  return Array.from({ length: TOTAL_ROOMS }, (_, i) => i + 1).filter(id => !occupied.has(id)).slice(legacyCount);
}
