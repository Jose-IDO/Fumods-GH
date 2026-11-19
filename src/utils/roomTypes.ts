export const ROOM_TYPES = [
  { value: 'double', label: 'Double Bed' },
  { value: 'twin', label: '2 Single Beds' },
] as const;

export function getRoomType(room: { roomType?: string; bedType?: string; numberOfBeds?: number }): string {
  const type = (room.roomType || '').toLowerCase().trim();
  const bed = (room.bedType || '').toLowerCase().trim();
  if (type === 'twin' || /(?:2|two)\s+single\s+beds?/.test(type)) return 'twin';
  if (type === 'double' || type === 'double bed') return 'double';
  if ((bed === 'single' || bed === 'single bed') && room.numberOfBeds === 2) return 'twin';
  if (bed === 'double' || bed === 'double bed') return 'double';
  return type;
}
