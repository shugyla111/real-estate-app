// Fills the database with the demo offers from data/offers.json.
// Run: npm run seed  (old offers and their photos are replaced, viewings for them are removed)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
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

console.log(`Seeded ${offers.length} offers.`);
