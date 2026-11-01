// Starts the app on a free port with a fresh database in memory (app.db is never touched).
import { once } from 'node:events';

export async function startServer() {
  process.env.DB_PATH = ':memory:';
  const { app } = await import('../src/app.js');
  const { seed } = await import('../src/seeder.js');
  seed();

  const server = app.listen(0);
  await once(server, 'listening');
  const base = `http://localhost:${server.address().port}`;

  const call = async (path, options) => {
    const res = await fetch(base + path, options);
    return { status: res.status, body: await res.json() };
  };

  return {
    get: (path) => call(path),
    post: (path, data) => call(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof data === 'string' ? data : JSON.stringify(data)
    }),
    close: () => server.close()
  };
}

// Dates relative to today, as "YYYY-MM-DD"
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// The next day (from tomorrow on) that is a weekday the agency works / a Sunday
export function nextWorkday() {
  const d = daysFromNow(1);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return iso(d);
}

export function nextSunday() {
  const d = daysFromNow(1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return iso(d);
}

export const isoDaysFromNow = (n) => iso(daysFromNow(n));
