import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { offersRouter } from './routes/offers.js';
import { viewingsRouter } from './routes/viewings.js';
import { contactRouter, newsletterRouter } from './routes/forms.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';

const here = dirname(fileURLToPath(import.meta.url));
const clientDir = join(here, '..', '..', 'client');

export const app = express();
app.use(express.json());

// Quick check that the server and the database answer
app.get('/api/health', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM offers').get();
  res.json({ ok: true, offers: count });
});

app.use('/api/offers', offersRouter);
app.use('/api/viewings', viewingsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Unknown API address -> JSON error instead of an HTML page
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// The website itself (index.html, css, js, images)
app.use(express.static(clientDir));

// Any error (broken JSON in a request, a bug) -> JSON answer, details only in the server log
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server.' : 'Bad request.' });
});
