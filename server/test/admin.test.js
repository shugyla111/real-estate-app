import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, nextWorkday } from './helpers.js';

let api;
let DEMO_AGENT;
let cookie; // "sid=..." after logging in
before(async () => { api = await startServer(); DEMO_AGENT = api.demoAgent; });
after(() => api.close());

const newOffer = (extra = {}) => ({
  title: 'Sunny studio near the beach', city: 'Valencia I.', price: 180000, area: 45, rooms: 1, beds: 1, baths: 1,
  type: 'Flat', floor: '2 of 4', year: 2010, terrace: true, description: 'Five minutes to the sea.',
  images: ['images/apartment2.jpg', 'images/apartment5.jpg'], ...extra
});

/* -------------------------------- logging in -------------------------------- */
test('without logging in the agent routes answer 401', async () => {
  assert.equal((await api.get('/api/auth/me')).status, 401);
  assert.equal((await api.get('/api/admin/viewings')).status, 401);
  assert.equal((await api.get('/api/admin/messages')).status, 401);
  assert.equal((await api.post('/api/offers', newOffer())).status, 401);
  assert.equal((await api.put('/api/offers/1', newOffer())).status, 401);
  assert.equal((await api.del('/api/offers/1')).status, 401);
  assert.equal((await api.get('/api/admin/viewings', 'sid=made-up-token')).status, 401);
});

test('wrong password and unknown email get the same answer', async () => {
  const wrong = await api.post('/api/auth/login', { email: DEMO_AGENT.email, password: 'nope' });
  const unknown = await api.post('/api/auth/login', { email: 'who@test.example', password: 'nope' });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
  assert.equal((await api.post('/api/auth/login', {})).status, 400);
});

test('logging in sets an httpOnly cookie and /me knows the agent', async () => {
  const res = await api.post('/api/auth/login', { email: DEMO_AGENT.email.toUpperCase(), password: DEMO_AGENT.password });
  assert.equal(res.status, 200);
  assert.equal(res.body.email, DEMO_AGENT.email);
  assert.equal('password_hash' in res.body, false);

  const setCookie = res.headers.get('set-cookie');
  assert.match(setCookie, /^sid=[\w-]+;/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  cookie = setCookie.split(';')[0];

  const me = await api.get('/api/auth/me', cookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.name, DEMO_AGENT.name);
});

/* ---------------------------------- offers ---------------------------------- */
test('an agent adds, changes and deletes an offer', async () => {
  const created = await api.post('/api/offers', newOffer(), cookie);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.deepEqual(created.body.images, ['images/apartment2.jpg', 'images/apartment5.jpg']);
  assert.equal(created.body.terrace, true);

  // visible to everybody in the search
  const found = await api.get('/api/offers?location=valencia');
  assert.deepEqual(found.body.items.map((o) => o.id), [id]);

  const changed = await api.put(`/api/offers/${id}`, newOffer({ price: 175000, terrace: false, images: ['images/apartment3.jpg'] }), cookie);
  assert.equal(changed.status, 200);
  assert.equal(changed.body.price, 175000);
  assert.equal(changed.body.terrace, false);
  assert.deepEqual(changed.body.images, ['images/apartment3.jpg']);

  assert.equal((await api.del(`/api/offers/${id}`, cookie)).status, 204);
  assert.equal((await api.get(`/api/offers/${id}`)).status, 404);
  assert.equal((await api.del(`/api/offers/${id}`, cookie)).status, 404);
});

test('offer form errors are listed per field', async () => {
  const { status, body } = await api.post('/api/offers', {
    title: '', city: 'X', price: -1, area: 'big', rooms: 1, beds: 1, baths: 1, type: 'Castle', year: 1500, images: []
  }, cookie);
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), ['area', 'images', 'price', 'title', 'type', 'year']);
});

test('photos must be existing files inside client/images', async () => {
  for (const path of ['images/missing.jpg', 'images/../../server/data/app.db', '/etc/passwd', 'https://example.com/a.jpg']) {
    const { status, body } = await api.post('/api/offers', newOffer({ images: [path] }), cookie);
    assert.equal(status, 400, path);
    assert.ok(body.errors.images, path);
  }
});

/* ---------------------------- viewings and inbox ---------------------------- */
test('the agent sees bookings and can cancel one, which frees the time', async () => {
  const date = nextWorkday();
  await api.post('/api/viewings', { offerId: 1, date, time: '15:00', name: 'Ana', email: 'ana@test.example' });

  const { body } = await api.get('/api/admin/viewings', cookie);
  const booking = body.items.find((v) => v.offerId === 1 && v.date === date && v.time === '15:00');
  assert.equal(booking.offerTitle, 'Large 4-room apartment with a beautiful terrace');

  assert.equal((await api.del(`/api/admin/viewings/${booking.id}`, cookie)).status, 204);
  const { body: day } = await api.get(`/api/offers/1/slots?date=${date}`);
  assert.equal(day.slots.find((s) => s.time === '15:00').free, true);
});

test('deleting an offer also removes its bookings', async () => {
  const { body: offer } = await api.post('/api/offers', newOffer(), cookie);
  await api.post('/api/viewings', { offerId: offer.id, date: nextWorkday(), time: '10:00', name: 'Bo', email: 'bo@test.example' });
  await api.del(`/api/offers/${offer.id}`, cookie);

  const { body } = await api.get('/api/admin/viewings', cookie);
  assert.equal(body.items.some((v) => v.offerId === offer.id), false);
});

test('the agent reads contact messages and subscribers, newest first', async () => {
  await api.post('/api/contact', { name: 'First', email: 'a@test.example', topic: 'buy', message: 'One' });
  await api.post('/api/contact', { name: 'Second', email: 'b@test.example', topic: 'sell', message: 'Two' });
  await api.post('/api/newsletter', { email: 'reader@test.example' });

  const messages = await api.get('/api/admin/messages', cookie);
  assert.deepEqual(messages.body.items.map((m) => m.name), ['Second', 'First']);

  const subscribers = await api.get('/api/admin/subscribers', cookie);
  assert.deepEqual(subscribers.body.items.map((s) => s.email), ['reader@test.example']);
});

/* --------------------------------- leaving --------------------------------- */
test('after logging out the old cookie no longer works', async () => {
  assert.equal((await api.post('/api/auth/logout', undefined, cookie)).status, 200);
  assert.equal((await api.get('/api/auth/me', cookie)).status, 401);
});

test('after 5 wrong passwords the login is blocked for a while', async () => {
  for (let i = 0; i < 5; i++) await api.post('/api/auth/login', { email: DEMO_AGENT.email, password: 'wrong' });
  const res = await api.post('/api/auth/login', { email: DEMO_AGENT.email, password: DEMO_AGENT.password });
  assert.equal(res.status, 429);
});

test('behind a proxy each visitor has their own login lock', async () => {
  // The previous test locked out 127.0.0.1. A visitor with another address (X-Forwarded-For) can still log in.
  const res = await fetch(`${api.base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.7' },
    body: JSON.stringify({ email: DEMO_AGENT.email, password: DEMO_AGENT.password })
  });
  assert.equal(res.status, 200);
});
