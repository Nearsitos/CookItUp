import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { createInventoryStore } from './inventoryStore.js';

function testApp() {
  return createApp({ store: createInventoryStore([]) });
}

const validItem = {
  name: 'Tomatoes',
  quantity: 4,
  unit: 'piece',
  expiry_date: '2026-11-10',
  category: 'produce',
  barcode: null,
};

describe('inventory API spike', () => {
  it('returns an empty inventory for a fresh store', async () => {
    const response = await request(testApp()).get('/api/inventory');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('creates and returns an inventory item', async () => {
    const response = await request(testApp()).post('/api/inventory').send(validItem);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(validItem);
    expect(response.body.id).toEqual(expect.any(String));
  });

  it('rejects invalid data with field details', async () => {
    const response = await request(testApp()).post('/api/inventory').send({
      name: '',
      quantity: -1,
      unit: 'piece',
      expiry_date: 'tomorrow',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toHaveLength(3);
  });

  it('updates and deletes an item', async () => {
    const app = testApp();
    const created = await request(app).post('/api/inventory').send(validItem);

    const updated = await request(app)
      .put(`/api/inventory/${created.body.id}`)
      .send({ quantity: 2 });
    expect(updated.status).toBe(200);
    expect(updated.body.quantity).toBe(2);

    const removed = await request(app).delete(`/api/inventory/${created.body.id}`);
    expect(removed.status).toBe(204);

    const missing = await request(app).get('/api/inventory');
    expect(missing.body).toEqual([]);
  });

  it('returns a consistent 404 error for unknown items', async () => {
    const response = await request(testApp()).put('/api/inventory/missing').send({ quantity: 2 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Inventory item not found.' },
    });
  });
});
