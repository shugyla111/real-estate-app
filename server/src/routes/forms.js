import { Router } from 'express';
import { db } from '../db.js';
import { collect, emailError, textError } from '../validate.js';

const TOPICS = ['buy', 'sell', 'rent', 'invest', 'other'];

// POST /api/contact  { name, email, phone, topic, message }
export const contactRouter = Router();

contactRouter.post('/', (req, res) => {
  const { name, email, phone, topic, message } = req.body ?? {};
  const errors = collect({
    name: textError(name, 'your name', { max: 100 }),
    email: emailError(email),
    phone: textError(phone, 'a phone number', { required: false, max: 30 }),
    topic: TOPICS.includes(topic) ? '' : 'Please choose a topic.',
    message: textError(message, 'a message', { max: 2000 })
  });
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the form.', errors });

  const { lastInsertRowid } = db.prepare(
    'INSERT INTO messages (name, email, phone, topic, message) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), email.trim(), phone?.trim() || null, topic, message.trim());
  res.status(201).json({ id: Number(lastInsertRowid) });
});

// POST /api/newsletter  { email }
export const newsletterRouter = Router();

newsletterRouter.post('/', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const error = emailError(email);
  if (error) return res.status(400).json({ error, errors: { email: error } });

  // Subscribing twice is fine: the same answer, no second row
  db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
  res.status(201).json({ ok: true });
});
