import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client');

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'kookitup',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'kookitup',
      connectTimeout: 3000,
    });
    await connection.ping();
    await connection.end();
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(express.static(clientDir));

app.listen(port, '0.0.0.0', () => {
  console.log(`CookItUp server listening on port ${port}`);
});
