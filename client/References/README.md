# Pantry MVP boilerplate

A self-contained, static HTML/CSS/JavaScript starter for a food inventory and recipe suggestion MVP. It does not use the existing app's scripts or styles.

## Run it

Open `index.html` in a browser. If your browser blocks local JSON loading, run a static server from this folder, for example `python -m http.server 8000`, then open `http://localhost:8000`.

## Included

- Dashboard overview with pantry counts and matching recipe ideas.
- Inventory search, alphabetical/calorie sorting, custom item entry, JSON import and export.
- Seven sample recipes, ranked by ingredient overlap, with recipe details and steps.
- Recipe photo support through the `image` field in `data/recipes.json`.
- Swipeable dashboard highlight carousel for planned meals, pantry suggestions, and a placeholder slot.
- Settings page with account, household, dietary preference and dark mode placeholders.
- Sample inventory and recipe data under `data/`.

## MVP boundaries

The browser loads starter data from JSON files when served locally. Direct `file://` opening uses bundled fallback data instead. Inventory edits save to browser local storage; JSON export is also available. Authentication, server storage, real food API search, macros and dark mode are future work.

Sample recipe photos use remote image URLs; they are not custom generated assets. Replace each `image` URL with a generated local file (for example, `assets/recipes/spinach-feta-omelet.jpg`) when artwork is available.

## Files

- `index.html` — page structure and dialog forms.
- `styles.css` — responsive visual styles.
- `cookitup.css` — visual overrides tuned to the supplied CookItUp dashboard reference.
- `ui-scale.css` — larger, more readable dashboard sizing and responsive adjustments.
- `mvp-tweaks.css` — inert navigation items, inventory feedback, carousel, and full-screen recipe details.
- `app.js` — navigation, inventory, filtering, sorting and recipe matching.
- `data/inventory.json` — starter pantry.
- `data/recipes.json` — recipe suggestion catalog.
