// Viewing rules, the same ones the offer page shows to the visitor.
import { db } from './db.js';

export const SLOTS = ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'];
const DAYS_AHEAD = 60;

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function dateError(value, now = new Date()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Please choose a date.';
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // new Date(2026, 1, 31) quietly becomes 3 March, so compare back
  if (toISO(date) !== value) return 'Please enter a valid date.';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const min = new Date(today); min.setDate(min.getDate() + 1);
  const max = new Date(today); max.setDate(max.getDate() + DAYS_AHEAD);
  if (date < min || date > max) return `Please choose a date within the next ${DAYS_AHEAD} days.`;
  if (date.getDay() === 0) return 'We do not hold viewings on Sundays. Please pick another day.';
  return '';
}

export function takenTimes(offerId, date) {
  return db.prepare('SELECT time FROM viewings WHERE offer_id = ? AND date = ?').all(offerId, date).map((r) => r.time);
}
