const { test } = require('node:test');
const assert = require('node:assert/strict');
const { freeRooms, HOLD_MS, isBlocking, validateSelections, validateStay } = require('../dist/utils/bookingRules');

test('48-hour boundary, confirmed bookings, and same-day turnaround', () => {
  const now = Date.parse('2030-01-01T12:00:00Z');
  const pending = { checkIn: '2030-02-01', checkOut: '2030-02-03', status: 'pending', expiresAt: new Date(now + HOLD_MS).toISOString(), physicalRoomIds: [1, 2], roomCount: 2 };
  assert.equal(isBlocking(pending, now + HOLD_MS - 1), true);
  assert.equal(isBlocking(pending, now + HOLD_MS), false);
  assert.equal(isBlocking({ ...pending, status: 'confirmed' }, now + HOLD_MS), true);
  assert.equal(freeRooms([pending], '2030-02-03', '2030-02-04', now).length, 5);
  assert.equal(freeRooms([pending], '2030-02-02', '2030-02-04', now).length, 3);
  assert.equal(freeRooms([{ ...pending, status: 'cancelled' }], '2030-02-02', '2030-02-04', now).length, 5);
});

test('all five rooms share inventory across listings and multi-room bookings', () => {
  const base = { checkIn: '2030-02-01', checkOut: '2030-02-03', status: 'confirmed' };
  assert.equal(freeRooms([{ ...base, roomId: 'a', physicalRoomIds: [1, 2, 3] }, { ...base, roomId: 'b', physicalRoomIds: [4, 5] }], base.checkIn, base.checkOut).length, 0);
  assert.equal(freeRooms([{ ...base, roomCount: 3 }], base.checkIn, base.checkOut).length, 2);
  assert.equal(freeRooms([{ ...base, checkOut: '2030-02-02', roomCount: 3 }, { ...base, checkIn: '2030-02-02', roomCount: 3 }], base.checkIn, base.checkOut).length, 2);
});

test('per-room occupancy, bed selection, counts, dates and timezone are validated', () => {
  validateSelections([{ bedType: 'double', adults: 2, babies: 1 }, { bedType: 'twin', adults: 1, babies: 0 }], 2);
  for (const room of [{ bedType: 'king', adults: 2, babies: 0 }, { bedType: 'double', adults: 3, babies: 0 }, { bedType: 'twin', adults: 2, babies: 2 }, { bedType: 'double', adults: 0, babies: 1 }, { bedType: 'double', adults: 1.5, babies: 0 }]) assert.throws(() => validateSelections([room], 1));
  for (const count of [0, 6, -1, 1.5]) assert.throws(() => validateSelections([], count));
  assert.throws(() => validateSelections([], 1));
  const now = Date.parse('2030-01-01T23:00:00Z');
  assert.throws(() => validateStay('2030-01-01', '2030-01-03', now));
  validateStay('2030-01-02', '2030-01-03', now);
  for (const dates of [['2030-02-30','2030-03-02'], ['2030-02-02','2030-02-02'], ['invalid','2030-03-02']]) assert.throws(() => validateStay(...dates, now));
});

// Small optimistic transaction store: transactions retry if any read document
// changes. This catches removal of the shared inventory lock during refactors.
function store() {
  const records = new Map(), versions = new Map();
  const clone = value => value && { ...value };
  const ref = path => ({ id: path.split('/').pop(), path,
    get: async () => snap(path), update: async data => write(path, data),
  });
  const snap = path => ({ id: path.split('/').pop(), exists: records.has(path), ref: ref(path), data: () => clone(records.get(path)) });
  const write = (path, data) => { records.set(path, { ...records.get(path), ...data }); versions.set(path, (versions.get(path) || 0) + 1); };
  const query = (name, filters = [], limit = Infinity) => ({ name, filters,
    doc: id => ref(name + '/' + id),
    where: (field, operator, value) => query(name, [...filters, [field, operator, value]], limit),
    limit: count => query(name, filters, count),
    get: async () => ({ docs: [...records].filter(([path, data]) => path.startsWith(name + '/') && filters.every(([key, op, value]) => op === 'in' ? value.includes(data[key]) : op === '<' ? data[key] < value : data[key] === value)).slice(0, limit).map(([path]) => snap(path)) }),
  });
  return { records, write, collection: query,
    async runTransaction(callback) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const reads = new Map(), writes = [];
        const tx = { async get(target) { if (target.path) { reads.set(target.path, versions.get(target.path) || 0); return snap(target.path); } return target.get(); },
          create(target, data) { writes.push([target.path, data]); }, update(target, data) { writes.push([target.path, data]); }, set(target, data) { writes.push([target.path, data]); },
        };
        const result = await callback(tx);
        if ([...reads].some(([path, version]) => (versions.get(path) || 0) !== version)) continue;
        writes.forEach(([path, data]) => write(path, data));
        return result;
      }
      throw Error('Transaction retry limit');
    },
  };
}

test('atomic reservations, retries, cancellation, payment and expiry end to end', async () => {
  const firestore = store();
  const stamp = ms => ({ toMillis: () => ms, toDate: () => new Date(ms) });
  const admin = { firestore: { Timestamp: { now: () => stamp(Date.now()), fromMillis: stamp, fromDate: date => stamp(date.getTime()) }, FieldValue: { increment: () => 1 } } };
  require.cache[require.resolve('../dist/config/firebaseAdmin')] = { exports: { firestore, admin } };
  const { BookingRepository } = require('../dist/repositories/bookingRepository');
  const repository = new BookingRepository();
  firestore.write('rooms/a', { status: 'active', price: 800 });
  firestore.write('rooms/b', { status: 'active', price: 900 });
  const dates = { checkIn: '2030-02-01', checkOut: '2030-02-03' };
  const dto = { ...dates, roomId: 'a', roomCount: 1, roomSelections: [{ bedType: 'double', adults: 2, babies: 1 }] };
  const attempts = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => repository.reserve('user', { ...dto, roomId: i % 2 ? 'a' : 'b', requestId: 'concurrent-' + i })));
  const accepted = attempts.filter(r => r.status === 'fulfilled').map(r => r.value);
  assert.equal(accepted.length, 5);
  assert.equal(attempts.filter(r => r.status === 'rejected').length, 1);
  assert.equal(new Set(accepted.flatMap(b => b.physicalRoomIds)).size, 5);
  for (const booking of accepted) assert.equal(Date.parse(booking.expiresAt) - Date.parse(booking.createdAt), HOLD_MS);
  assert.equal((await repository.availability(dates.checkIn, dates.checkOut)).availableRooms, 0);
  const retry = await repository.reserve('user', { ...dto, roomId: 'b', requestId: 'concurrent-0' });
  assert.equal(retry.id, accepted[0].id);
  await repository.updateStatus(accepted[0].id, 'cancelled');
  assert.equal((await repository.availability(dates.checkIn, dates.checkOut)).availableRooms, 1);
  await assert.rejects(repository.reserve('user', { ...dto, requestId: 'too-many', roomCount: 2, roomSelections: [dto.roomSelections[0], dto.roomSelections[0]] }), /Only 1/);
  assert.equal([...firestore.records.keys()].filter(key => key.startsWith('bookings/')).length, 5, 'Failed group reservation must not partially save');
  const replacement = await repository.reserve('user', { ...dto, requestId: 'replacement' });
  assert.equal(replacement.totalPrice, 1600);
  await repository.confirmByPaymentRef(replacement.paymentReference);
  assert.equal((await repository.findById(replacement.id)).status, 'pending');
  assert.equal((await repository.findById(replacement.id)).paymentStatus, 'paid');
  await repository.updateStatus(replacement.id, 'confirmed');
  firestore.write('bookings/' + replacement.id, { expiresAt: stamp(Date.now() - 1) });
  assert.equal((await repository.findById(replacement.id)).status, 'confirmed');
  const expired = accepted[1];
  firestore.write('bookings/' + expired.id, { expiresAt: stamp(Date.now() - 1) });
  assert.equal((await repository.availability(dates.checkIn, dates.checkOut)).availableRooms, 1);
  await assert.rejects(repository.updateStatus(expired.id, 'confirmed'), /expired/);
  await repository.confirmByPaymentRef(expired.paymentReference);
  assert.equal((await repository.findById(expired.id)).status, 'expired');
  await repository.cancelExpiredPendings(new Date().toISOString());
  assert.equal(firestore.records.get('bookings/' + expired.id).status, 'expired');
  assert.equal((await repository.availability(dates.checkOut, '2030-02-04')).availableRooms, 5);
  const mixed = await repository.reserve('user', { ...dto, checkIn: dates.checkOut, checkOut: '2030-02-04', requestId: 'mixed', roomCount: 2, roomSelections: [{ bedType: 'double', adults: 2, babies: 1 }, { bedType: 'twin', adults: 1, babies: 0 }] });
  assert.equal(mixed.roomCount, 2);
  assert.equal(mixed.guests, 3);
  assert.equal(mixed.babies, 1);
  assert.deepEqual(mixed.roomSelections.map(room => room.bedType), ['double', 'twin']);
  assert.equal(mixed.physicalRoomIds.length, 2);
  await assert.rejects(repository.updateStatus(mixed.id, 'pending'), /confirmed or cancelled/);
});
