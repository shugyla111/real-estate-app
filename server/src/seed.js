// Fills the database with the demo offers from data/offers.json.
// Run: npm run seed  (old offers and their photos are replaced, viewings for them are removed)
import { seed } from './seeder.js';

console.log(`Seeded ${seed()} offers.`);
