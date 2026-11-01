// Passwords, sessions and the "only for logged-in agents" check.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';

export const COOKIE = 'sid';
const SESSION_DAYS = 7;

/* -------------------------------- passwords -------------------------------- */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [, saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Used when the email is unknown, so a wrong email takes as long as a wrong password
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'));

export function findAgentByLogin(email, password) {
  const agent = db.prepare('SELECT * FROM agents WHERE email = ?').get(email.trim().toLowerCase());
  const ok = verifyPassword(password, agent ? agent.password_hash : DUMMY_HASH);
  return ok && agent ? agent : null;
}

export function createAgent({ name, email, password }) {
  const { lastInsertRowid } = db.prepare('INSERT INTO agents (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), hashPassword(password));
  return Number(lastInsertRowid);
}

/* --------------------------------- sessions --------------------------------- */
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export function createSession(agentId) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
  db.prepare('INSERT INTO sessions (token_hash, agent_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), agentId, expires.toISOString());
  return { token, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 };
}

export function deleteSession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function agentFromToken(token) {
  if (!token) return null;
  return db.prepare(`
    SELECT agents.id, agents.name, agents.email FROM sessions
    JOIN agents ON agents.id = sessions.agent_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(sha256(token), new Date().toISOString()) ?? null;
}

// "a=1; sid=xyz" -> { a: '1', sid: 'xyz' }
export function readCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((part) => {
    const i = part.indexOf('=');
    return i < 0 ? [part.trim(), ''] : [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }));
}

export const cookieOptions = (maxAge) => ({
  httpOnly: true, // page scripts cannot read it
  sameSite: 'lax', // not sent with requests that other sites start
  secure: process.env.NODE_ENV === 'production', // https only on the real server
  path: '/',
  maxAge
});

// Put this in front of a route that only agents may use
export function requireAgent(req, res, next) {
  const agent = agentFromToken(readCookies(req)[COOKIE]);
  if (!agent) return res.status(401).json({ error: 'Please log in.' });
  req.agent = agent;
  next();
}
