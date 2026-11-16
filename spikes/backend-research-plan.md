# Backend research spikes

Status: proposed
Last updated: 2026-11-02

This document turns the backend items in `research-checklist.md` into small experiments for the current prototype. The goal is to learn enough to make an implementation decision, not to build production infrastructure inside `spikes/`.

## Current constraints

- The server is an empty Node 20 placeholder (`server/app.js`).
- The client already has inventory, recipe, and scan service boundaries.
- The planned API is documented in `client/docs/api-contract.md`.
- The database schema is still a placeholder, so persistence should not block the first API experiment.
- Keep secrets in `.env`; never commit API keys or real user data.

## Recommended order

### 1. Mock inventory API — first

Question: Can the client-facing inventory contract be implemented cleanly with Express, validation, and consistent errors before choosing a database?

Experiment:

- Add a temporary Express app under `spikes/backend-api/`.
- Implement `GET`, `POST`, `PUT /:id`, and `DELETE /:id` for `/api/inventory`.
- Use the fields in `client/mock-data/inventory.json`: `id`, `name`, `quantity`, `unit`, `expiry_date`, `category`, and `barcode`.
- Validate request bodies and return a predictable error shape.
- Add CORS and a request body-size limit.
- Exercise every route with a small automated test or documented HTTP examples.

Success means the existing `inventoryService.js` can call the API without knowing whether storage is mock data or the server, and invalid input produces useful 4xx responses.

Decision to record: validation library, error response shape, ID strategy, and whether dates are stored as ISO date strings.

### 2. MySQL persistence

Question: Does the draft data model support the inventory operations without awkward queries or premature user/auth coupling?

Experiment:

- Define `users` and `inventory_items` tables with a foreign key.
- Use a `mysql2` connection pool and parameterized queries.
- Seed one development user and a few inventory rows.
- Run the same API checks against MySQL and compare behavior with the in-memory version.

Success means the API behavior is unchanged when the repository switches from memory to MySQL, including empty results, missing IDs, and validation errors.

Decision to record: schema, indexes, timestamp/date types, migration approach, and local development setup.

### 3. Frontend integration

Question: Can the client switch between mock data and the real API through one configuration point?

Experiment:

- Add a small client config module with `mock` and `api` modes.
- Keep service method names and returned data shapes stable.
- Add loading and error handling to the inventory view.
- Verify that the mock mode still works when the server is unavailable.

Success means changing one setting switches the inventory screen between mock data and the API without view-level changes.

### 4. Backend hardening

Question: What minimum safeguards are needed before exposing recipe suggestions or scan endpoints?

Experiment:

- Add Helmet, rate limiting, request-size limits, and structured logging.
- Cap inventory items sent to an AI provider.
- Keep AI and OCR calls behind server-side service modules.
- Add tests for malformed input, oversized requests, and provider failures.

Success means failures are bounded, secrets remain server-side, and provider errors do not leak keys or raw internal details.

## First spike deliverable

Start with the mock inventory API. Do not add authentication, AI calls, receipt uploads, or deployment configuration to this spike. Those concerns would make it harder to isolate whether the basic backend contract works.

At the end of the spike, record:

1. What was tested.
2. What worked and what failed.
3. The chosen request/response shapes.
4. The next implementation issue, if the experiment is worth keeping.

