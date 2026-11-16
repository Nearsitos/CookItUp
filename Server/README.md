# Server

CookItUp's prototype backend runs as a Node.js/Express service with MySQL. The
Raspberry Pi hosts the app; the same server can also run on a developer laptop.

## Local development

1. Install Node.js 20 or newer and MySQL 8, or use the repository's Docker
   Compose setup.
2. Copy `.env.example` to `.env`, set the database password, and set
   `DB_HOST=127.0.0.1` for a local MySQL install.
3. Create the `kookitup` database. The current SQL schema file is still a draft
   placeholder; table migrations will be added with the CRUD implementation.
4. Run `npm install` and `npm run server` from the repository root.
5. Open `http://localhost:3000` or check `http://localhost:3000/api/health`.

The server serves the existing `client/` app and exposes `/api/health`. Keep
database credentials on the server; never add them to `client/` or commit `.env`.

## Raspberry Pi

See [Raspberry Pi setup](../docs/raspberry-pi-setup.md) for first-time setup,
deploying updates from GitHub, and private remote team testing. The optional
Raspberry Pi AI HAT+ 2 can later host a separate local inference service; the
core API does not depend on it.
