// Lists for the admin panel. Every route here needs a logged-in agent.
import { Router } from 'express';
import { db } from '../db.js';
import { requireAgent } from '../auth.js';

export const adminRouter = Router();
adminRouter.use(requireAgent);

// GET /api/admin/viewings -> all bookings, the nearest first
adminRouter.get('/viewings', (req, res) => {
  const items = db.prepare(`
    SELECT viewings.id, viewings.offer_id AS offerId, offers.title AS offerTitle,
           viewings.date, viewings.time, viewings.name, viewings.email, viewings.message, viewings.created_at AS createdAt
    FROM viewings JOIN offers ON offers.id = viewings.offer_id
    ORDER BY viewings.date, viewings.time
  `).all();
  res.json({ total: items.length, items });
});

// DELETE /api/admin/viewings/5 -> cancel a booking (the time becomes free again)
adminRouter.delete('/viewings/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM viewings WHERE id = ?').run(Number(req.params.id) || 0);
  if (!changes) return res.status(404).json({ error: 'Viewing not found' });
  res.status(204).end();
});

// GET /api/admin/messages -> contact form messages, newest first
adminRouter.get('/messages', (req, res) => {
  const items = db.prepare(
    'SELECT id, name, email, phone, topic, message, created_at AS createdAt FROM messages ORDER BY id DESC'
  ).all();
  res.json({ total: items.length, items });
});

// GET /api/admin/subscribers -> newsletter emails, newest first
adminRouter.get('/subscribers', (req, res) => {
  const items = db.prepare('SELECT id, email, created_at AS createdAt FROM subscribers ORDER BY id DESC').all();
  res.json({ total: items.length, items });
});
