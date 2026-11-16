import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './db/pool.js';
import inventoryRouter from './routes/inventory.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client');

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.use('/api/inventory', inventoryRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use('/api', (error, _req, res, _next) => {
  const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
});
app.use(express.static(clientDir));

app.listen(port, '0.0.0.0', () => {
  console.log(`CookItUp server listening on port ${port}`);
});
