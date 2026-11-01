import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let api;
before(async () => { api = await startServer(); });
after(() => api.close());

const ids = async (query) => {
  const { status, body } = await api.get(`/api/offers${query}`);
  assert.equal(status, 200, body.error);
  assert.equal(body.total, body.items.length);
  return body.items.map((o) => o.id);
};

test('health check counts the offers', async () => {
  const { status, body } = await api.get('/api/health');
  assert.equal(status, 200);
  assert.deepEqual(body, { ok: true, offers: 6 });
});

test('without filters all offers come back in id order', async () => {
  assert.deepEqual(await ids(''), [1, 2, 3, 4, 5, 6]);
});

test('an offer has the fields the website uses', async () => {
  const { body } = await api.get('/api/offers?type=Penthouse');
  const offer = body.items[0];
  assert.equal(offer.id, 3);
  assert.equal(offer.terrace, true);
  assert.equal(offer.images.length, 3);
  assert.equal('created_at' in offer, false);
});

test('location searches city and title, any letter case', async () => {
  assert.deepEqual(await ids('?location=MADRID'), [3, 4, 6]);
  assert.deepEqual(await ids('?location=terrace'), [1, 3]);
});

test('% and _ in the location are plain characters', async () => {
  assert.deepEqual(await ids('?location=%25'), []);
  assert.deepEqual(await ids('?location=_'), []);
});

test('price range', async () => {
  assert.deepEqual(await ids('?minPrice=300000&maxPrice=400000'), [1, 4, 5]);
});

test('beds and baths: several values, the last one means "and more"', async () => {
  assert.deepEqual(await ids('?beds=2&beds=3'), [1, 2, 4, 5]);
  assert.deepEqual(await ids('?beds=4'), [3, 6]);
  assert.deepEqual(await ids('?baths=3'), [3, 6]);
});

test('city, type, area and year ranges', async () => {
  assert.deepEqual(await ids('?city=Barcelona'), [1, 2, 5]);
  assert.deepEqual(await ids('?type=Penthouse&type=House'), [3, 6]);
  assert.deepEqual(await ids('?area=100-149&area=200-'), [1, 4, 6]);
  assert.deepEqual(await ids('?year=-1999'), [5]);
});

test('filters combine with AND', async () => {
  assert.deepEqual(await ids('?city=Madrid&terrace=yes&maxPrice=500000'), [3, 4]);
});

test('sorting', async () => {
  assert.deepEqual(await ids('?sort=price-asc'), [2, 5, 1, 4, 3, 6]);
  assert.deepEqual(await ids('?sort=price-desc'), [6, 3, 4, 1, 5, 2]);
  assert.deepEqual(await ids('?sort=area-desc'), [6, 3, 4, 1, 5, 2]);
  assert.deepEqual(await ids('?sort=newest'), [4, 3, 6, 1, 2, 5]);
});

test('wrong filter values give 400 with a message', async () => {
  for (const query of ['?beds=abc', '?minPrice=-5', '?sort=cheapest', '?area=10', '?year=-', '?type=Castle']) {
    const { status, body } = await api.get(`/api/offers${query}`);
    assert.equal(status, 400, query);
    assert.ok(body.error, query);
  }
});

test('one offer by id, 404 for a missing one', async () => {
  const { status, body } = await api.get('/api/offers/2');
  assert.equal(status, 200);
  assert.equal(body.title, 'Bright and airy 2-bedroom flat near the city center');

  assert.equal((await api.get('/api/offers/99')).status, 404);
  assert.equal((await api.get('/api/offers/abc')).status, 404);
});

test('unknown API address gives a JSON 404', async () => {
  const { status, body } = await api.get('/api/nothing-here');
  assert.equal(status, 404);
  assert.equal(body.error, 'Not found');
});
