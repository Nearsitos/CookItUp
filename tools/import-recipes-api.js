// tools/import-recipes-api.js
// Imports recipes from recipe-api.com (needs RECIPE_API_KEY in .env).
// Run with: node --env-file=.env tools/import-recipes-api.js

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const API = "https://recipe-api.com/api/v1";
const KEY = process.env.RECIPE_API_KEY;
const CACHE_DIR = "tools/cache";
const PER_SEARCH = 5; // recipes to take from each search
const SEARCHES = [
  "breakfast eggs",
  "omelet",
  "pancakes",
  "spinach salad",
  "tomato pasta",
  "chicken rice",
  "lentil soup",
  "salmon",
  "tacos",
  "vegetable stir fry",
];
const SKIP = [
  "Classic Hainanese Chicken Rice",
  "Philadelphia Rolls",
  "Smoky Spanish Chorizo And Tomato Pasta",
  "Orange Honey Poppy Seed Dressing",
];
const OUTPUT = "client/data/recipes.json";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!KEY) {
  console.error(
    "Missing RECIPE_API_KEY. Add it to .env and run with --env-file=.env",
  );
  process.exit(1);
}

await mkdir(CACHE_DIR, { recursive: true });

// "PT1H15M" -> 75
function minutesFrom(duration) {
  if (!duration) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(duration);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  return hours * 60 + minutes;
}

// Full recipe by id. Reads from tools/cache if saved; otherwise fetches (1 credit) and saves.
async function getFullRecipe(id) {
  const file = `${CACHE_DIR}/${id}.json`;

  try {
    return JSON.parse(await readFile(file, "utf8")).data;
  } catch {
    // Not cached yet, so fetch it below.
  }

  const response = await fetch(`${API}/recipes/${id}`, {
    headers: { "X-API-Key": KEY },
  });
  if (!response.ok) {
    throw new Error(
      `Recipe ${id} failed: ${response.status} ${await response.text()}`,
    );
  }
  const recipe = await response.json();
  await writeFile(file, JSON.stringify(recipe, null, 2));
  console.log(` fetched ${id} (${recipe.usage.detail_remaining} credits left)`);
  return recipe.data;
}

// RecipeAPI full recipe -> CookItUp recipes.json format
function toRecipe(full) {
  const names = full.ingredients
    .flatMap((group) => group.items)
    .map((item) => item.name.charAt(0).toUpperCase() + item.name.slice(1));

  return {
    id: `rapi-${full.id}`,
    name: full.name,
    time: minutesFrom(full.meta.total_time),
    servings: full.meta.yield_count,
    calories: Math.round(full.nutrition.per_serving.calories),
    category: full.category,
    description: full.description,
    ingredients: [...new Set(names)],
    steps: full.instructions.map((step) => step.text),
  };
}

// --- Step 5a: plan which recipes to import (searches only, free) ---------
const chosen = new Map(); // id -> summary, so the same recipe isn't picked twice
for (const term of SEARCHES) {
  const response = await fetch(`${API}/recipes?q=${encodeURIComponent(term)}`, {
    headers: { "X-API-Key": KEY },
  });
  if (!response.ok) {
    console.error(
      `Search "${term}" failed:`,
      response.status,
      await response.text(),
    );
    process.exit(1);
  }
  const result = await response.json();
  for (const summary of result.data.slice(0, PER_SEARCH)) {
    if (!SKIP.includes(summary.name)) chosen.set(summary.id, summary);
  }
  await wait(7000); // the free plan allows 10 requests per minute
}

const cached = [...chosen.keys()].filter((id) =>
  existsSync(`${CACHE_DIR}/${id}.json`),
);
console.log(
  `\nPlan: ${chosen.size} recipes (${cached.length} already cached, ` +
    `${chosen.size - cached.length} would cost credits)\n`,
);
for (const summary of chosen.values()) {
  console.log(` - [${summary.category}] ${summary.name}`);
}
// --- Step 5b: import (spends credits; only runs with --go) ----------------
if (!process.argv.includes("--go")) {
  console.log("\nDry run only. Re-run with --go to import these recipes.");
  process.exit(0);
}

const imported = [];
for (const id of chosen.keys()) {
  const wasCached = existsSync(`${CACHE_DIR}/${id}.json`);
  try {
    imported.push(toRecipe(await getFullRecipe(id)));
  } catch (error) {
    console.error(`Skipping ${id}: ${error.message}`);
  }
  if (!wasCached) await wait(7000); // stay under 10 requests per minute
}

const existing = JSON.parse(await readFile(OUTPUT, "utf8"));
// Keep hand-written recipes; drop old TheMealDB and RecipeAPI imports (replaced below).
const handWritten = existing.filter(
  (recipe) =>
    !recipe.id.startsWith("mealdb-") && !recipe.id.startsWith("rapi-"),
);
const all = [...handWritten, ...imported];

await writeFile(OUTPUT, JSON.stringify(all, null, 2) + "\n");
console.log(
  `\nSaved ${all.length} recipes (${handWritten.length} hand-written + ${imported.length} from RecipeAPI).`,
);
