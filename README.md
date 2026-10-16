# CookItUp
A cooking and grocery management lightweight web app that connects recipes, shopping lists, and food inventory. Users can find recipes from food they already have or choose a recipe and automatically create a shopping list for missing ingredients. We will use smart AI integration to assist the user in planning and preparing their grocery shaping and meal prep. Get AI-powered recipe suggestions based on the food you already have, prioritizing first what's about to expire soon.

[Show Image]() [Live demo]() · [Project board]() · [Design files]()

## What it does
Track your food inventory with quantities and expiry dates
Get AI recipe suggestions built from what you already own
Prioritize expiring food to cut down on waste
Respect diet preferences and restrictions (allergies, vegetarian, etc.)
Use context such as "quick dinner" or "meal prep" to shape suggestions
Scan a barcode or receipt to add items automatically

## Status: MVP prototype (Sprint 1).
The UI runs on mock data. Backend, database, and AI integrations are planned for later sprints, see our [roadmap](#roadmap).

## Tech stack
* MVP prototype	Planned.
* Frontend:	HTML, CSS, vanilla JavaScript (ES modules)	Possible migration to React + Vite.
* Backend:	Node.js + Express.
* Database:	JSON mock data	MySQL.
* AI	mock suggestions	LLM API called from the server only.
* Scanning	fake scan results	Barcode library, receipt OCR / vision model.
* Tooling	ESLint, Prettier, Vitest	Docker Compose.
* CI	GitHub Actions	Automated deploy.
* Getting started.

## Prerequisites.
* VS Code with the Live Server and Prettier extensions.
* Node.js 20 or newer (used for linting and tests only; the app itself needs no build step).
* Run the prototype
* bash
* git clone https://github.com/Nearsitos/CookItUp.git
* cd YOUR-REPO
* npm install

Then open client/index.html with Live Server (right-click the file in VS Code → Open with Live Server).

ES modules and fetch for mock data need a local server. Double-clicking index.html won't work.

## Useful commands
Command	What it does
1. Check code for problems
 
 ```powershell
 nmp run lint
 ```

2. Auto-fix what can be fixed

 ```powershell
 npm run lint:fix	
 ```

3. Format all files with Prettier
 
 ```powershell
 npm run format
 ```

4. Run unit tests
 
 ```npm test
 npm test	Run unit tests
 ```

Before opening a pull request, run npm run lint and npm test. CI runs the same checks.

```Project structure
client/
├── index.html          App shell and navigation
├── css/                base.css, layout.css, components.css
├── js/
│   ├── main.js         Entry point
│   ├── router.js       Switches between views
│   ├── state.js        Shared app state
│   ├── config.js       Mock vs. real API switch (one place)
│   ├── services/       Data access. Views never fetch directly
│   ├── views/          One file per screen
│   ├── components/     Reusable UI pieces
│   └── utils/          Pure helper functions (tested)
├── mock-data/          JSON used until the backend exists
└── assets/
server/                 Planned backend (routes, services, db)
docs/                   Architecture, API contract, DB schema
```

The one rule that matters
Views call services. Services decide where data comes from. Today services read from mock-data/. Later they call /api/.... Because of this, switching to the real backend should not require changing any view code.

## Security rules
* Never put an API key in anything under client/. Browser code is public.
* AI and OCR calls happen on the server only.
* Secrets go in .env (git-ignored). Add placeholder names to .env.example.
* Team workflow
* Pick an issue from the project board and assign yourself.
* Create a branch: feature/short-description or fix/short-description.
* Commit small and often with clear messages (Add expiry badge to inventory card).
* Open a pull request into main. Link the issue (Closes #12).
* Wait for CI to pass and at least one teammate review, then merge.

**MAIN SHOULD ALWAYS WORK!**.

If you decide to work with AI coding assistants; Paste this into your assistant at the start of your session:
```
This is a vanilla HTML/CSS/JS project using ES modules, no build step. Follow the structure in README.md. Views call services; services handle data. Never put API keys in client code. Match existing code style. Keep changes small and focused on one feature. Do not add new libraries without asking.
```

**ALWAYS READ AND UNDERSTAND THE CODE BEFORE COMMITING IT.** You're responsible for it.
```Run npm run lint``` and ```npm test```, and try the feature in the browser.
Ask the assistant to explain anything you don't understand.

## Roadmap
The following items I plan to fix, improve, and/or add to this project in the future:
 * Sprint 1: App shell, inventory view, preferences form, mock recipe suggestions, scan UI with fake results
 * Sprint 2: Backend skeleton, MySQL schema, real inventory CRUD
 * Sprint 3: AI recipe endpoint using inventory, expiry, and preferences
 * Sprint 4: Real barcode scanning, then receipt OCR

Later: 
* [ ] User accounts
* [ ] deployment 
* [ ] accessibility pass
* [ ] polish


## Team
```
Name	Focus area	GitHub
Name	e.g. Inventory	@handle
Name	e.g. Recipes	@handle
```

Short notes on why we chose things. Add new entries as we go. [Decisions log]()


Vanilla JS for the MVP: lowest barrier for a team with mixed experience; no build tools to debug. The service layer keeps a later React migration cheap.
Plain CSS with variables: no compile step. Revisit Sass if the stylesheet becomes hard to manage.
Server-side AI calls: protects API keys and lets us control cost with rate limiting.

For educational use as part of WDDx99.
