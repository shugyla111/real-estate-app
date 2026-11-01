// Adds a real agent with a random password.
// Run: npm run create-agent -- maria@agency.es "Maria Lopez"
import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { createAgent } from './auth.js';
import { isEmail } from './validate.js';

const [email, name] = process.argv.slice(2);
if (!email || !name || !isEmail(email)) {
  console.error('Usage: npm run create-agent -- email@example.com "Full Name"');
  process.exit(1);
}
if (db.prepare('SELECT id FROM agents WHERE email = ?').get(email.toLowerCase())) {
  console.error(`An agent with ${email} already exists.`);
  process.exit(1);
}

const password = randomBytes(12).toString('base64url');
createAgent({ name, email, password });
console.log(`Agent created: ${email}\nPassword: ${password}\nSave it now, it is not shown again.`);
