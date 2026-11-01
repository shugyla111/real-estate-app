import { Router } from 'express';
import { db } from '../db.js';
import { SLOTS, dateError, takenTimes } from '../booking.js';

export const offersRouter = Router();

const TYPES = ['Flat', 'Penthouse', 'House'];
const SORTS = {
  'price-asc': 'price ASC',
  'price-desc': 'price DESC',
  'area-desc': 'area DESC',
  'newest': 'year DESC'
};

// ?beds=2&beds=3 gives an array, ?beds=2 a string, no ?beds nothing
const list = (value) => (value === undefined ? [] : [].concat(value));

class BadRequest extends Error {}

const toNumber = (value, name) => {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < 0) throw new BadRequest(`"${name}" must be a positive number`);
  return n;
};

// "100-149", "200-" or "-1999" -> SQL for one range. An empty side means no limit.
function rangeSql(column, value, params) {
  const m = /^(\d*)-(\d*)$/.exec(value);
  if (!m || (m[1] === '' && m[2] === '')) throw new BadRequest(`"${column}" range must look like 100-149`);
  const parts = [];
  if (m[1] !== '') { parts.push(`${column} >= ?`); params.push(Number(m[1])); }
  if (m[2] !== '') { parts.push(`${column} <= ?`); params.push(Number(m[2])); }
  return `(${parts.join(' AND ')})`;
}

// The last option in a group means "and more": 4+ beds, 3+ baths
function countSql(column, values, top, params) {
  return values.map((v) => {
    const n = toNumber(v, column);
    params.push(n);
    return n >= top ? `${column} >= ?` : `${column} = ?`;
  });
}

// Builds WHERE and ORDER BY from the same query string the search page puts in its address
function buildQuery(q) {
  const where = [];
  const params = [];
  const anyOf = (parts) => { if (parts.length) where.push(`(${parts.join(' OR ')})`); };

  const location = String(q.location ?? '').trim().toLowerCase();
  if (location) {
    where.push("(lower(city) LIKE ? ESCAPE '\\' OR lower(title) LIKE ? ESCAPE '\\')");
    const like = `%${location.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(like, like);
  }
  if (q.minPrice) { where.push('price >= ?'); params.push(toNumber(q.minPrice, 'minPrice')); }
  if (q.maxPrice) { where.push('price <= ?'); params.push(toNumber(q.maxPrice, 'maxPrice')); }

  anyOf(countSql('beds', list(q.beds), 4, params));
  anyOf(countSql('baths', list(q.baths), 3, params));
  anyOf(list(q.city).map((c) => { params.push(`${c}%`); return 'city LIKE ?'; }));
  anyOf(list(q.area).map((r) => rangeSql('area', r, params)));
  anyOf(list(q.year).map((r) => rangeSql('year', r, params)));

  const types = list(q.type);
  const unknown = types.find((t) => !TYPES.includes(t));
  if (unknown) throw new BadRequest(`Unknown type "${unknown}"`);
  if (types.length) { where.push(`type IN (${types.map(() => '?').join(', ')})`); params.push(...types); }

  if (q.terrace === 'yes') where.push('terrace = 1');

  const sort = q.sort ? SORTS[q.sort] : 'id ASC';
  if (!sort) throw new BadRequest(`Unknown sort "${q.sort}"`);

  return { sql: `${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${sort}`, params };
}

// Database row -> what the website gets
function withImages(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const images = db.prepare(
    `SELECT offer_id, url FROM offer_images WHERE offer_id IN (${ids.map(() => '?').join(', ')}) ORDER BY position`
  ).all(...ids);

  return rows.map(({ created_at, ...row }) => ({
    ...row,
    terrace: row.terrace === 1,
    images: images.filter((img) => img.offer_id === row.id).map((img) => img.url)
  }));
}

// GET /api/offers?location=barcelona&beds=2&beds=4&sort=price-asc
offersRouter.get('/', (req, res) => {
  try {
    const { sql, params } = buildQuery(req.query);
    const rows = db.prepare(`SELECT * FROM offers ${sql}`).all(...params);
    const items = withImages(rows);
    res.json({ total: items.length, items });
  } catch (err) {
    if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
    throw err;
  }
});

// GET /api/offers/3
offersRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = Number.isInteger(id) ? db.prepare('SELECT * FROM offers WHERE id = ?').get(id) : undefined;
  if (!row) return res.status(404).json({ error: 'Offer not found' });
  res.json(withImages([row])[0]);
});

// GET /api/offers/3/slots?date=2026-11-12 -> which viewing times are still free that day
offersRouter.get('/:id/slots', (req, res) => {
  const id = Number(req.params.id);
  const offer = Number.isInteger(id) ? db.prepare('SELECT id FROM offers WHERE id = ?').get(id) : undefined;
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  const { date } = req.query;
  const error = dateError(date);
  if (error) return res.status(400).json({ error });

  const taken = takenTimes(id, date);
  res.json({ date, slots: SLOTS.map((time) => ({ time, free: !taken.includes(time) })) });
});
