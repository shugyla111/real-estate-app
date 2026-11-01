// Fills the database with the demo offers from data/offers.json and adds the demo agent.
// Run: npm run seed  (old offers and their photos are replaced, viewings for them are removed)
import { DEMO_AGENT, seed, seedDemoAgent } from './seeder.js';

console.log(`Seeded ${seed()} offers.`);
if (seedDemoAgent()) console.log(`Demo agent: ${DEMO_AGENT.email} / ${DEMO_AGENT.password}`);
