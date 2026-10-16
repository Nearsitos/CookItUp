# Research Checklist and Service Options

_Last checked: October 2026. Free tiers, pricing, and browser support change often. Re-verify before committing to anything._

## How to use this

Each item is a **spike**: a tiny throwaway experiment (a few hours max) in a personal branch or `spikes/` folder. For each one:

1. Read the linked docs (30 min).
2. Paste the prompt into a **separate AI chat** to get a working test feature.
3. Run it, break it, and understand it.
4. Write 3 to 5 lines in the README **Decisions log**: what you tried, what worked, what you recommend.
5. Turn the finding into scoped issues for your team.

**Prompt prefix** (paste before every prompt below):

> I'm a student learning web development. Keep the code minimal and heavily commented. Explain each file and why it exists. Use plain JavaScript with ES modules (no TypeScript, no frameworks) unless I say otherwise. Never hardcode API keys; use a `.env` file.

---

## Part 1: Personal checklist

### Do first (highest risk)

- [ ] **A. Receipt OCR test** _(Sprint 4 feature, but the biggest unknown, so test early)_
  - Gather 10 real receipts (varied stores, some crumpled or faded) and photograph them with a phone.
  - Docs: [Tesseract.js](https://github.com/naptha/tesseract.js), [Claude vision](https://docs.claude.com) (search "vision"), [AWS Textract AnalyzeExpense](https://docs.aws.amazon.com/textract/), [Azure Document Intelligence](https://learn.microsoft.com/azure/ai-services/document-intelligence/), [Google Document AI](https://cloud.google.com/document-ai/docs)
  - Prompt:
    > Build a small Node script that takes a receipt image path and extracts a JSON list of grocery items (name, quantity, price) using a vision-capable LLM API. Then build a second version using Tesseract.js plus simple text parsing. Print both results side by side for the same image so I can compare accuracy. Include a script that runs both on every image in a `receipts/` folder and saves results to a JSON file.
  - Success: you know which approach reads your 10 receipts best, and roughly what each costs per scan.

- [ ] **B. AI recipe suggestion test** _(Sprint 3)_
  - Docs: [Claude API docs](https://docs.claude.com), [OpenAI docs](https://platform.openai.com/docs), [Gemini docs](https://ai.google.dev/docs); search "structured outputs" in whichever you pick
  - Prompt:
    > Create a minimal Express server with POST /api/recipes/suggest. It receives JSON: `{ inventory: [{name, quantity, unit, expiry_date}], preferences: {diet, allergies, dislikes}, priority: "expiring_first" | "none", context: "quick dinner" }`. It calls an LLM API with the key from .env and returns 3 recipes as JSON validated with Zod (title, ingredients used, missing ingredients, steps, time). Prioritize items that expire soonest when asked. Include a test script with sample data.
  - Success: output is reliably valid JSON, uses expiring items, and you've tried to trick it (for example, add "peanuts" to allergies and see if it slips).

### Sprint 2: Backend and database

- [ ] **C. Express API with mock data**
  - Docs: [Express](https://expressjs.com/), [Node.js](https://nodejs.org/), [Postman](https://www.postman.com/) or [Bruno](https://www.usebruno.com/) for testing endpoints
  - Prompt:
    > Create an Express server with CRUD routes for /api/inventory (GET, POST, PUT /:id, DELETE /:id) storing items in memory. Match the fields in my mock JSON: `id, name, quantity, unit, expiry_date, category, barcode`. Add CORS, a central error handler, and Zod validation. Show how to test each route in Postman.

- [ ] **D. Connect to MySQL**
  - Docs: [mysql2](https://sidorares.github.io/node-mysql2/docs), [MySQL docs](https://dev.mysql.com/doc/)
  - Prompt:
    > Extend my Express inventory API to use MySQL via mysql2 with a connection pool and parameterized queries. Give me a `schema.sql` creating `users` and `inventory_items` tables with a foreign key, and a seed script. Explain SQL injection and show where parameterization protects me.

- [ ] **E. Docker Compose (app + MySQL)**
  - Docs: [Docker Compose](https://docs.docker.com/compose/)
  - Prompt:
    > Write a Dockerfile for my Express app and a docker-compose.yml that runs it with MySQL 8, a named volume, environment variables from .env, and a healthcheck so the app waits for the database. Explain every line.

- [ ] **F. Flip the frontend from mock to real API**
  - Docs: [MDN Fetch](https://developer.mozilla.org/docs/Web/API/Fetch_API), [MDN CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS)
  - Prompt:
    > Here is my `inventoryService.js` (paste it). Refactor it so a single `config.js` controls mock vs. real API, with the real branch calling my Express endpoints and handling loading and error states.

### Sprint 3: AI hardening

- [ ] **G. Rate limiting and input limits**
  - Docs: [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), [helmet](https://helmetjs.github.io/)
  - Prompt:
    > Add per-IP rate limiting, a request body size limit, and helmet to my recipe suggestion endpoint. Also add a hard cap on how many inventory items can be sent to the AI.

- [ ] **H. Allergen safety check in code**
  - Prompt:
    > Add a function that checks AI-generated recipe ingredients against the user's allergy list using a synonym map (for example, "peanut" also matches "groundnut" and "peanut butter"). Reject or flag recipes that fail. Include unit tests with Vitest.

- [ ] **I. Prompt injection test**
  - Docs: [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
  - Prompt:
    > Show me how a malicious inventory item name like "ignore previous instructions and..." could affect my recipe prompt. Then modify my prompt and code to treat item names as untrusted data, and write tests with attack strings.

### Sprint 4: Scanning

- [ ] **J. Barcode scanning in the browser (test on an iPhone and an Android phone)**
  - Docs: [MDN BarcodeDetector](https://developer.mozilla.org/docs/Web/API/BarcodeDetector), [MDN getUserMedia](https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia), [barcode-detector ponyfill](https://github.com/Sec-ant/barcode-detector)
  - Prompt:
    > Build a plain HTML/JS page that opens the phone camera, scans EAN-13 and UPC-A barcodes continuously, and shows the decoded number. Use the native BarcodeDetector if available and fall back to the `barcode-detector` npm ponyfill (zxing-wasm) otherwise. Include a manual number-entry fallback. Explain how to test on my phone over HTTPS during development.
  - Why test on real phones: native support is uneven (see Part 2).

- [ ] **K. Barcode to product name lookup**
  - Docs: [Open Food Facts API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/), [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide)
  - Prompt:
    > Write a Node function `lookupBarcode(code)` that queries Open Food Facts API with a proper User-Agent header, caches results in memory, handles "product not found", and returns `{name, brand, quantity, category, allergens}`. Then add a USDA FoodData Central fallback. Respect rate limits.

- [ ] **L. Receipt line items to clean food names**
  - Prompt:
    > Write a function that takes raw receipt lines like "ORG BNNA 2.1LB" and "GV WHL MLK 1GAL" and returns normalized items `{name, quantity, unit, category, estimated_shelf_life_days}`. Do it with an LLM call returning validated JSON, and add a small lookup table for shelf life by category. Include 15 test cases.

- [ ] **M. Image upload handling**
  - Docs: [multer](https://github.com/expressjs/multer)
  - Prompt:
    > Add a POST /api/scan/receipt endpoint using multer with memory storage, a 5 MB limit, image-type checks, and no files saved to disk. Add client-side image resizing before upload with a canvas.

### Later

- [ ] **N. Authentication**
  - Docs: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [Firebase Auth](https://firebase.google.com/docs/auth), [Auth0](https://auth0.com/docs)
  - Prompt:
    > Add user registration and login to my Express + MySQL app using bcrypt and sessions (httpOnly cookies). Scope every inventory query to the logged-in user. Then show me the same thing using a managed provider so I can compare.

- [ ] **O. Deployment**
  - Docs: [Render](https://render.com/docs), [Railway](https://docs.railway.com/), [GitHub Pages](https://docs.github.com/pages)
  - Prompt:
    > Walk me through deploying my Express + MySQL app to [chosen host], including environment variables, a production start script, and CORS for my deployed frontend URL.

- [ ] **P. Quality pass: accessibility, performance, PWA**
  - Docs: [WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/), [Lighthouse](https://developer.chrome.com/docs/lighthouse), [web.dev PWA course](https://web.dev/learn/pwa), [Playwright](https://playwright.dev/), [Supertest](https://github.com/ladjs/supertest)
  - Prompt:
    > Audit my index.html and CSS for accessibility problems (labels, contrast, keyboard navigation, ARIA) and give me prioritized fixes. Then add a web app manifest and a basic service worker so the inventory loads offline.

### Non-code tasks

- [ ] **Q.** Usability-test the prototype with 3 to 5 people (kitchen-realistic tasks, not demos).
- [ ] **R.** Decide unit normalization rules (cups vs. grams) and default expiry estimates before Sprint 3.
- [ ] **S.** Write a one-page privacy note (what's stored, receipts deleted after processing).

---

## Part 2: Service options by feature

**Quick picks (my starting recommendations):** GitHub Pages for the prototype demo, Railway or Render for the backend, local Docker MySQL for development, Claude or Gemini for recipes, the `barcode-detector` ponyfill plus Open Food Facts for barcodes, and a vision LLM for receipts (compare against Tesseract.js in spike A). Adjust after your spikes.

### 1. Frontend hosting (prototype demo)

| Service              | Pros                                                                 | Cons                                                                                                       |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **GitHub Pages**     | Free; lives in your repo; zero setup                                 | Static only; no server-side code                                                                           |
| **Cloudflare Pages** | Free static hosting, fast CDN                                        | Another account to manage; Workers (serverless) don't run full Node                                        |
| **Netlify / Vercel** | Easy deploys from GitHub; PR preview URLs; some serverless functions | Free tiers have moved to credit/usage models; serverless isn't a great fit for a long-lived Express server |

### 2. Backend hosting (Express API)

| Service                               | Pros                                                                                                      | Cons                                                                                                                                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Render**                            | Simple deploys from GitHub; automatic HTTPS; free tier for web services has existed for personal projects | Free services sleep after inactivity (30-60s cold start); managed database is Postgres, not MySQL (you'd run MySQL as a Docker service); sources I found disagreed on free-tier details, so verify |
| **Railway**                           | Good developer experience; MySQL available natively alongside your app; usage-based billing               | Trial/credit based; credits can run out; billing model needs watching                                                                                                                              |
| **Fly.io**                            | Flexible containers, region control                                                                       | No free tier for new accounts; needs Dockerfile and CLI; not beginner-friendly                                                                                                                     |
| **VPS** (DigitalOcean, Hetzner, etc.) | Full control; good learning experience; looks good on a resume                                            | Paid; you manage security, updates, Nginx, TLS                                                                                                                                                     |
| **Class or university hosting**       | May be free and approved by your instructor                                                               | May lack Node or MySQL support; ask early                                                                                                                                                          |

### 3. MySQL database

| Service                                                 | Pros                                                            | Cons                                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Local MySQL in Docker**                               | Free; same setup for everyone; no account needed                | Only for development; each person has separate data                                     |
| **Railway MySQL**                                       | One platform for app and DB; easy                               | Usage-based cost; student credits are limited                                           |
| **TiDB Cloud / Aiven**                                  | MySQL-compatible or MySQL services that have offered free tiers | Free-tier terms change; verify limits; slight compatibility differences possible (TiDB) |
| **PlanetScale**                                         | Well known MySQL-compatible platform                            | Free tier was removed in 2024 (verify current plans); paid                              |
| **Managed cloud DB** (AWS RDS, Azure, Google Cloud SQL) | Industry standard; strong resume value                          | Complex setup; costs can surprise you; free tiers are time-limited                      |

### 4. AI model for recipe suggestions

| Service                    | Pros                                                                                                                | Cons                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Claude API (Anthropic)** | Strong at following constraints and structured output; vision supports receipts too (one provider for two features) | Paid per token; no free API tier                                                                       |
| **OpenAI API**             | Most widely used; huge community and tutorials; vision supported                                                    | Paid; model names and pricing change frequently                                                        |
| **Google Gemini API**      | Has had a free tier, good for prototyping; vision supported                                                         | Free tier limits and data-use terms need checking; terms can differ between free and paid              |
| **Local models (Ollama)**  | Free; private; no API key                                                                                           | Needs capable hardware; weaker quality; can't be hosted on cheap servers; harder for the team to share |

All options require server-side calls. Whatever you pick, set a spending cap and add rate limiting.

### 5. Recipe data (optional, to ground the AI)

| Service            | Pros                                                    | Cons                                                                        |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| **None (AI only)** | Simplest; most flexible                                 | Recipes may be invented or unrealistic; no source to cite                   |
| **TheMealDB**      | Free and simple; supports search by ingredient          | Small dataset; limited dietary and nutrition data; not for commercial use   |
| **Spoonacular**    | Large database; search by ingredients, diets, nutrition | Limited free quota; paid beyond that; attribution rules                     |
| **Edamam**         | Strong dietary and nutrition filters                    | Account and quota limits; terms are restrictive; verify current free access |

### 6. Barcode decoding (in the browser)

| Option                                       | Pros                                                               | Cons                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Native `BarcodeDetector`**                 | Built in; fast; no library                                         | **Unreliable support:** not in Firefox, disabled by default in Safari/iOS, partial on desktop Chrome; formats vary by device. Don't rely on it alone |
| **`barcode-detector` ponyfill (zxing-wasm)** | Works across modern browsers including iPhones; same API as native | Adds a WASM file to load; a bit slower; weaker on blurry or angled codes                                                                             |
| **html5-qrcode / ZXing-js**                  | Popular and beginner friendly; built-in camera UI                  | Older libraries with less active maintenance; the ZXing-js polyfill is described as less reliable than native                                        |
| **Dynamsoft**                                | Very robust commercial engine                                      | Requires a license; overkill for a class project                                                                                                     |

### 7. Product lookup from a barcode

| Service                                      | Pros                                                                       | Cons                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open Food Facts**                          | Free; no API key; millions of products; includes ingredients and allergens | Crowdsourced so some products are missing or incomplete; requires a User-Agent; rate-limited (cache results); open-license attribution (ODbL) rules |
| **USDA FoodData Central**                    | Free government data with an API key; includes branded US products         | US-focused; less friendly structure; may lack newer products                                                                                        |
| **UPCitemdb / Barcode Lookup**               | Broad product coverage (non-food too)                                      | Small free quotas; paid plans; terms vary                                                                                                           |
| **Ask a vision LLM about the package photo** | Handles products no database has                                           | Costs per request; can guess wrong; needs a photo, not just a number                                                                                |

Plan a manual-entry fallback regardless, because no database has everything.

### 8. Receipt reading (OCR + parsing)

| Option                                                                                                                                | Pros                                                                                         | Cons                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Tesseract.js**                                                                                                                      | Free; runs in the browser or server; no account                                              | Accuracy drops on faded, crumpled, or low-quality receipts; returns raw text you must parse yourself                  |
| **Cloud receipt parsers** (AWS Textract AnalyzeExpense, Azure Document Intelligence receipt model, Google Document AI expense parser) | Built for receipts; return structured line items                                             | Cloud account and billing setup; pay per page; free tiers vary; abbreviated item names still need cleanup             |
| **Vision-capable LLM** (Claude, GPT, Gemini)                                                                                          | One call can read and interpret and normalize; handles odd layouts; same provider as recipes | Per-call cost; may hallucinate items or prices, so always use a review screen; privacy implications of sending images |
| **Specialized receipt APIs** (Veryfi, Mindee, Taggun)                                                                                 | High accuracy; quick to integrate                                                            | Limited free quotas; paid; extra vendor to manage                                                                     |

### 9. Authentication (later)

| Option                            | Pros                                        | Cons                                                           |
| --------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| **DIY: sessions + bcrypt/argon2** | Great for learning; free; works with MySQL  | Easy to get subtly wrong; you own password resets and security |
| **Firebase Auth**                 | Mature; free for common uses; social logins | Google-specific; separate user store from your MySQL data      |
| **Auth0 / Clerk**                 | Polished; secure; fast to add               | Free-tier limits; vendor lock-in; extra integration work       |
| **Supabase Auth**                 | Easy and open source                        | Tied to Postgres; awkward alongside a MySQL database           |

---

## Reminder

None of this needs to be decided now. Do spikes **A** and **B** first, since AI quality and receipt accuracy are the two things most likely to change your plan.
