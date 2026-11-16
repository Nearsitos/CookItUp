import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { createInventoryStore } from './inventoryStore.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const inventoryFields = {
  name: z.string().trim().min(1).max(100),
  quantity: z.number().positive().finite(),
  unit: z.string().trim().min(1).max(30),
  expiry_date: dateSchema.nullable().optional(),
  category: z.string().trim().min(1).max(50).nullable().optional(),
  barcode: z.string().trim().max(50).nullable().optional(),
};

const createInventorySchema = z.object(inventoryFields).strict();
const updateInventorySchema = createInventorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update',
);

function validationError(error) {
  return {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'The request contains invalid inventory data.',
    details: error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    })),
  };
}

export function createApp({ store = createInventoryStore() } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/inventory', (_request, response) => {
    response.json(store.list());
  });

  app.post('/api/inventory', (request, response, next) => {
    const result = createInventorySchema.safeParse(request.body);
    if (!result.success) return next(validationError(result.error));

    response.status(201).json(store.create(result.data));
  });

  app.put('/api/inventory/:id', (request, response, next) => {
    const result = updateInventorySchema.safeParse(request.body);
    if (!result.success) return next(validationError(result.error));

    const updated = store.update(request.params.id, result.data);
    if (!updated) {
      return next({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Inventory item not found.',
      });
    }

    response.json(updated);
  });

  app.delete('/api/inventory/:id', (request, response, next) => {
    if (!store.remove(request.params.id)) {
      return next({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Inventory item not found.',
      });
    }

    response.status(204).send();
  });

  app.use((_request, _response, next) => {
    next({ status: 404, code: 'NOT_FOUND', message: 'Route not found.' });
  });

  app.use((error, _request, response, _next) => {
    const status = error.status ?? 500;
    response.status(status).json({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: status === 500 ? 'Internal server error.' : error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  });

  return app;
}
