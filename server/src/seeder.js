// Puts the demo offers from data/offers.json into the database.
// Used by `npm run seed` and by the tests.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { createAgent } from './auth.js';

const here = dirname(fileURLToPath(import.meta.url));

export function seed() {
  const offers = JSON.parse(readFileSync(join(here, '..', 'data', 'offers.json'), 'utf8'));

  const insertOffer = db.prepare(`
    INSERT INTO offers (id, title, city, price, area, rooms, beds, baths, type, floor, year, terrace, description)
    VALUES (:id, :title, :city, :price, :area, :rooms, :beds, :baths, :type, :floor, :year, :terrace, :description)
  `);
  const insertImage = db.prepare('INSERT INTO offer_images (offer_id, url, position) VALUES (?, ?, ?)');

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM offers');
    for (const { images, ...offer } of offers) {
      insertOffer.run({ ...offer, terrace: offer.terrace ? 1 : 0, description: offer.description ?? null });
      images.forEach((url, i) => insertImage.run(offer.id, url, i));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return offers.length;
}

// Demo login for the admin panel (see README). Created only once.
export const DEMO_AGENT = { name: 'Demo Agent', email: 'agent@realestate.example', password: 'demo-agent-2026' };

export function seedDemoAgent() {
  const exists = db.prepare('SELECT id FROM agents WHERE email = ?').get(DEMO_AGENT.email);
  if (!exists) createAgent(DEMO_AGENT);
  return !exists;
}
