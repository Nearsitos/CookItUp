# Backend

The backend uses Node.js, Express, and the MySQL `food_app` schema. Docker
Compose starts the API and database together. On a new database volume, MySQL
loads the full Workbench schema from `server/db/init/` and seeds a private
prototype user plus the Calories nutrient.

## Inventory API

- `GET /api/inventory` lists the current prototype user's active batches.
- `POST /api/inventory` creates a food item and inventory batch.
- `PUT /api/inventory/:id` updates the batch and its food item details.
- `DELETE /api/inventory/:id` soft-deletes the batch, preserving consumption
  history and related records.
- `GET /api/health` checks database connectivity.

Inventory JSON uses the frontend's field names: `name`, `category`, `storage`,
`quantity`, `unit`, `calories`, `servingSize`, and `expiryDate`. The API uses one
shared prototype user from `DEFAULT_USER_ID` until sign-in is implemented.
Keep remote testing private; these endpoints do not authenticate users.

## Local development

Install Node.js 20 or newer and MySQL 8. Copy `.env.example` to `.env`, set the
database passwords, and set `DB_HOST=127.0.0.1` when connecting to a local MySQL
installation. Create the `food_app` database and run
`server/db/init/001_food_app_schema.sql` with a MySQL account allowed to create
the schema. Then run `npm install` and `npm run server` from the repository root.

For the Pi deployment, including first-time schema initialization and remote
team testing, follow [the Raspberry Pi guide](../docs/raspberry-pi-setup.md).
