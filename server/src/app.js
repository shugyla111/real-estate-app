import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const clientDir = join(here, '..', '..', 'client');

export const app = express();
app.use(express.json());

// Quick check that the server and the database answer
app.get('/api/health', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM offers').get();
  res.json({ ok: true, offers: count });
});

// Unknown API address -> JSON error instead of an HTML page
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// The website itself (index.html, css, js, images)
app.use(express.static(clientDir));
