# Backend prototype

The server is intentionally kept small while the team runs the research spikes in
`/spikes/backend-research-plan.md`.

The first spike is an in-memory inventory API. It should establish the request,
response, validation, and error contracts before MySQL or AI-provider code is added.

Planned boundaries:

- `routes/` — HTTP route definitions
- `services/` — recipe, OCR, barcode, and other application services
- `db/` — connection and schema/migration code
- `app.js` — application setup and middleware

Never commit `.env` files or API keys.
