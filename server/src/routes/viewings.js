import { Router } from 'express';
import { db } from '../db.js';
import { SLOTS, dateError } from '../booking.js';
import { collect, emailError, textError } from '../validate.js';

export const viewingsRouter = Router();

// POST /api/viewings  { offerId, date: "2026-11-12", time: "11:00", name, email, message }
viewingsRouter.post('/', (req, res) => {
  const { offerId, date, time, name, email, message } = req.body ?? {};

  const offer = Number.isInteger(offerId) ? db.prepare('SELECT id FROM offers WHERE id = ?').get(offerId) : undefined;
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  const errors = collect({
    date: dateError(date),
    time: SLOTS.includes(time) ? '' : 'Please choose a time.',
    name: textError(name, 'your name', { max: 100 }),
    email: emailError(email),
    message: textError(message, 'a message', { required: false, max: 2000 })
  });
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please check the form.', errors });

  try {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO viewings (offer_id, date, time, name, email, message) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(offerId, date, time, name.trim(), email.trim(), message?.trim() || null);
    res.status(201).json({ id: Number(lastInsertRowid), offerId, date, time });
  } catch (err) {
    // UNIQUE (offer_id, date, time) in schema.sql: somebody already has this slot
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'This time has just been booked. Please choose another one.', errors: { time: 'This time is no longer free.' } });
    }
    throw err;
  }
});
