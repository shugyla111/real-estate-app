import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, nextWorkday, nextSunday, isoDaysFromNow } from './helpers.js';

let api;
before(async () => { api = await startServer(); });
after(() => api.close());

const booking = (extra = {}) => ({
  offerId: 2, date: nextWorkday(), time: '11:00', name: 'Ana', email: 'ana@test.example', ...extra
});

/* ------------------------------- viewings ------------------------------- */
test('all slots are free on a new day', async () => {
  const { status, body } = await api.get(`/api/offers/1/slots?date=${nextWorkday()}`);
  assert.equal(status, 200);
  assert.equal(body.slots.length, 8);
  assert.ok(body.slots.every((s) => s.free));
});

test('a booking is saved and its time is no longer free', async () => {
  const { status, body } = await api.post('/api/viewings', booking());
  assert.equal(status, 201);
  assert.equal(body.time, '11:00');

  const { body: day } = await api.get(`/api/offers/2/slots?date=${nextWorkday()}`);
  assert.equal(day.slots.find((s) => s.time === '11:00').free, false);
  assert.equal(day.slots.filter((s) => s.free).length, 7);
});

test('the same time cannot be booked twice (409)', async () => {
  const { status, body } = await api.post('/api/viewings', booking({ name: 'Bo', email: 'bo@test.example' }));
  assert.equal(status, 409);
  assert.ok(body.errors.time);
});

test('the same time on another offer is still free', async () => {
  const { status } = await api.post('/api/viewings', booking({ offerId: 3 }));
  assert.equal(status, 201);
});

test('booking rules: no Sundays, not too far ahead, not today, real dates only', async () => {
  for (const date of [nextSunday(), isoDaysFromNow(61), isoDaysFromNow(0), '2026-02-31', '12.11.2026']) {
    const { status, body } = await api.post('/api/viewings', booking({ date, time: '10:00' }));
    assert.equal(status, 400, date);
    assert.ok(body.errors.date, date);
  }
});

test('booking with empty fields lists every problem', async () => {
  const { status, body } = await api.post('/api/viewings', booking({ time: '09:00', name: ' ', email: 'nope' }));
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'name', 'time']);
});

test('booking a missing offer gives 404', async () => {
  assert.equal((await api.post('/api/viewings', booking({ offerId: 99 }))).status, 404);
  assert.equal((await api.get(`/api/offers/99/slots?date=${nextWorkday()}`)).status, 404);
});

test('slots for a Sunday give 400', async () => {
  assert.equal((await api.get(`/api/offers/1/slots?date=${nextSunday()}`)).status, 400);
});

/* -------------------------------- contact -------------------------------- */
test('contact message is saved', async () => {
  const { status, body } = await api.post('/api/contact', {
    name: 'Ana', email: 'ana@test.example', topic: 'buy', message: 'Hello'
  });
  assert.equal(status, 201);
  assert.ok(body.id);
});

test('contact form errors are listed per field', async () => {
  const { status, body } = await api.post('/api/contact', { name: '', email: 'x', topic: 'castle', message: '' });
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'message', 'name', 'topic']);
});

test('too long message is refused', async () => {
  const { status, body } = await api.post('/api/contact', {
    name: 'Ana', email: 'ana@test.example', topic: 'other', message: 'a'.repeat(2001)
  });
  assert.equal(status, 400);
  assert.ok(body.errors.message);
});

/* ------------------------------- newsletter ------------------------------- */
test('subscribing twice (any letter case) is fine', async () => {
  assert.equal((await api.post('/api/newsletter', { email: 'Ana@Test.example' })).status, 201);
  assert.equal((await api.post('/api/newsletter', { email: 'ana@test.example' })).status, 201);
});

test('newsletter needs a valid email', async () => {
  const { status, body } = await api.post('/api/newsletter', { email: 'bad' });
  assert.equal(status, 400);
  assert.ok(body.errors.email);
});

/* --------------------------------- errors --------------------------------- */
test('broken JSON gives a JSON 400, not an HTML page', async () => {
  const { status, body } = await api.post('/api/contact', '{broken');
  assert.equal(status, 400);
  assert.equal(body.error, 'Bad request.');
});
