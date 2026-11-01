// Starts the app on a free port with a fresh database in memory (app.db is never touched).
import { once } from 'node:events';

export async function startServer() {
  process.env.DB_PATH = ':memory:';
  const { db } = await import('../src/db.js');
  // A test file must not import anything from src/ at the top: that opens the real app.db
  // before DB_PATH is set. Stop instead of wiping real data.
  if (db.location() !== null) throw new Error(`Tests must use an in-memory database, got ${db.location()}`);
  const { app } = await import('../src/app.js');
  const { seed, seedDemoAgent, DEMO_AGENT } = await import('../src/seeder.js');
  seed();
  seedDemoAgent();

  const server = app.listen(0);
  await once(server, 'listening');
  const base = `http://localhost:${server.address().port}`;

  // cookie: the "sid=..." string from a login answer, to call as a logged-in agent
  const call = async (method, path, data, cookie) => {
    const headers = {};
    if (data !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(base + path, {
      method, headers, body: data === undefined ? undefined : (typeof data === 'string' ? data : JSON.stringify(data))
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
  };

  return {
    get: (path, cookie) => call('GET', path, undefined, cookie),
    post: (path, data, cookie) => call('POST', path, data, cookie),
    put: (path, data, cookie) => call('PUT', path, data, cookie),
    del: (path, cookie) => call('DELETE', path, undefined, cookie),
    demoAgent: DEMO_AGENT,
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
