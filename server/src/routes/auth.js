import { Router } from 'express';
import {
  COOKIE, agentFromToken, cookieOptions, createSession, deleteSession, findAgentByLogin, readCookies
} from '../auth.js';

export const authRouter = Router();

// Slows down password guessing: after 5 wrong tries an address waits 15 minutes
const MAX_TRIES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map(); // ip -> { count, since }

function tooManyTries(ip) {
  const entry = failures.get(ip);
  if (entry && Date.now() - entry.since > WINDOW_MS) failures.delete(ip);
  return (failures.get(ip)?.count ?? 0) >= MAX_TRIES;
}

function recordFailure(ip) {
  const entry = failures.get(ip) ?? { count: 0, since: Date.now() };
  entry.count += 1;
  failures.set(ip, entry);
}

// POST /api/auth/login  { email, password }
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (tooManyTries(req.ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' });
  }
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const agent = findAgentByLogin(email, password);
  if (!agent) {
    recordFailure(req.ip);
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  failures.delete(req.ip);
  const { token, maxAge } = createSession(agent.id);
  res.cookie(COOKIE, token, cookieOptions(maxAge));
  res.json({ id: agent.id, name: agent.name, email: agent.email });
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  deleteSession(readCookies(req)[COOKIE]);
  res.clearCookie(COOKIE, cookieOptions());
  res.json({ ok: true });
});

// GET /api/auth/me -> the logged-in agent, or 401
authRouter.get('/me', (req, res) => {
  const agent = agentFromToken(readCookies(req)[COOKIE]);
  if (!agent) return res.status(401).json({ error: 'Please log in.' });
  res.json(agent);
});
