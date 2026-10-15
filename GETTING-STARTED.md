# Getting Started: Your First Day

Follow this once. After that, jump to [Daily workflow](#daily-workflow).

## 1. Install (one time, ~15 min)

1. [VS Code](https://code.visualstudio.com/)
2. [Git](https://git-scm.com/downloads)
3. [Node.js](https://nodejs.org/) (LTS version, 20 or newer)
4. VS Code extensions: **Live Server**, **Prettier - Code formatter**, **ESLint**
5. In VS Code settings, turn on **Format On Save** and set **Default Formatter** to Prettier

Check it worked: open a terminal and run `git --version` and `node --version`. Both should print a version number.

## 2. Get the project (one time)

```bash
git clone https://github.com/YOUR-ORG/YOUR-REPO.git
cd YOUR-REPO
npm install
code .
```

Right-click `client/index.html` → **Open with Live Server**. You should see the app in your browser.

## 3. Know where things go

| I'm working on... | I edit... |
|---|---|
| A screen | `client/js/views/` |
| A reusable piece (card, badge) | `client/js/components/` |
| Where data comes from | `client/js/services/` |
| Styling | `client/css/` |
| Fake data | `client/mock-data/` |
| Helper logic (dates, matching) | `client/js/utils/` |

**The one rule:** views never fetch data themselves. They ask a service. That way we can swap fake data for the real backend later without rewriting screens.

**Never put a password or API key in anything under `client/`.** Browser code is public.

## Daily workflow

Every time you work, follow these five steps.

**1. Start from the latest `main`**
```bash
git checkout main
git pull
```

**2. Make a branch for your task** (one branch per issue)
```bash
git checkout -b feature/inventory-view
```

**3. Build it.** Save often, and check it in the browser.

**4. Check your work, then commit**
```bash
npm run lint
npm test
git add .
git commit -m "Add expiry badge to inventory card"
```

**5. Push and open a pull request**
```bash
git push -u origin feature/inventory-view
```
Then click the link GitHub shows (or go to the repo → **Pull requests** → **New**). Write a sentence on what you did, add `Closes #12` (your issue number), and ask a teammate to review.

Merge only when the green CI check passes and someone has reviewed it.

## Team rules

- **Never commit directly to `main`.** Always use a branch and PR.
- **One task per branch.** Small PRs get reviewed faster.
- **Pull `main` often** so your branch doesn't drift.
- **Don't edit someone else's feature files** without telling them. Ownership is by feature.
- **Commit messages say what changed:** "Add diet filter to recipes view," not "stuff."
- **Stuck for 20 minutes? Ask.** Post in the team chat with your error message.

## Using an AI assistant

Paste this at the start of each session:

> This is a vanilla HTML/CSS/JS project using ES modules, no build step. Follow the structure in README.md. Views call services; services handle data. Never put API keys in client code. Match existing code style. Keep changes small and focused on one feature. Do not add new libraries without asking.

Then:

- Ask for **one small thing at a time**, not a whole app.
- **Read the code before you commit it.** You'll have to explain and fix it.
- Test it in the browser, and run `npm run lint`.
- Ask "explain this line by line" for anything you don't understand.
- If the AI suggests installing a new library or creating new folders, check with the team first.

## When something goes wrong

| Problem | Fix |
|---|---|
| Page is blank | Press F12 → **Console** tab and read the red error. Paste it into your AI or the team chat |
| `import` / `fetch` errors | You opened the file directly. Use **Live Server** |
| CI is red on my PR | Click **Details** on the failed check, read the message, run `npm run lint:fix` and `npm run format`, then push again |
| "Merge conflict" | Don't panic and don't guess. Ask a teammate before resolving it |
| Committed a secret by accident | Tell the team immediately. The key must be replaced, since deleting the file isn't enough |

## Cheat sheet

```bash
git checkout main && git pull         # start fresh
git checkout -b feature/my-task       # new branch
npm run lint && npm test              # check before commit
git add . && git commit -m "message"  # save your work
git push -u origin feature/my-task    # upload, then open a PR
```
