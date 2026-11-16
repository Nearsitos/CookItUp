# In-memory inventory API spike

This is a throwaway backend experiment. It answers one question: can the planned inventory contract work cleanly before we choose a database?

## Run it

From the project root:

```bash
npm install
npm run spike:api
```

The API starts at `http://localhost:3000`.

Run the spike tests in another terminal:

```bash
npx vitest run spikes/backend-api/app.test.js
```

## Endpoints

- `GET /api/health`
- `GET /api/inventory`
- `POST /api/inventory`
- `PUT /api/inventory/:id`
- `DELETE /api/inventory/:id`

Example create request:

```json
{
  "name": "Tomatoes",
  "quantity": 4,
  "unit": "piece",
  "expiry_date": "2026-11-10",
  "category": "produce",
  "barcode": null
}
```

## What to learn from this spike

- The store is deliberately in memory, so restarting the process resets data.
- Zod validates input at the HTTP boundary.
- Every error uses `{ error: { code, message, details? } }`.
- The app factory accepts a store, which makes tests isolated and makes a future MySQL store replaceable.
- `PUT` is currently a partial update despite the method name; confirm whether the team wants this behavior before the contract is finalized.

## Follow-up decisions

After running the tests and trying the endpoints manually, record whether to keep:

1. ISO `YYYY-MM-DD` expiry dates.
2. Numeric quantities with free-form units.
3. Nullable barcode/category values.
4. Partial `PUT` updates or a stricter replacement contract.
5. The current error envelope.
