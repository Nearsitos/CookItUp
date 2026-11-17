// tools/import-recipes.js
// One-time import: fetches recipes from TheMealDB and converts them for CookItUp.
// Run with: node tools/import-recipes.js

import { readFile, writeFile } from "node:fs/promises";

const API = "https://www.themealdb.com/api/json/v1/1";
const SEARCHES = ["chicken", "beef", "pasta", "rice", "egg", "salmon", "soup", "salad"];
const OUTPUT = "client/data/recipes.json";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toRecipe(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    if (name && name.trim()) {
      const clean = name.trim();
      ingredients.push(clean.charAt(0).toUpperCase() + clean.slice(1));
    }
  }

  const steps = meal.strInstructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^step\s*\d+[:.]?$/.test(line));

  return {
    id: `mealdb-${meal.idMeal}`,
    name: meal.strMeal,
    image: meal.strMealThumb,
    time: 30,
    category: meal.strCategory,
    description:
      meal.strArea && meal.strArea !== "Unknown"
        ? `${meal.strArea} · ${meal.strCategory}`
        : meal.strCategory,
    ingredients,
    steps,
  };
}

const imported = new Map(); // id -> recipe, so duplicates collapse automatically

for (const term of SEARCHES) {
  const response = await fetch(`${API}/search.php?s=${encodeURIComponent(term)}`);
  const data = await response.json();
  for (const meal of data.meals || []) {
    const recipe = toRecipe(meal);
    imported.set(recipe.id, recipe);
  }
  console.log(`"${term}": ${data.meals?.length || 0} meals`);
  await wait(1000); // be kind to the shared test key
}

const existing = JSON.parse(await readFile(OUTPUT, "utf8"));
const handWritten = existing.filter((recipe) => !recipe.id.startsWith("mealdb-"));
const all = [...handWritten, ...imported.values()];

await writeFile(OUTPUT, JSON.stringify(all, null, 2) + "\n");
console.log(
  `Saved ${all.length} recipes (${handWritten.length} hand-written + ${imported.size} imported).`,
);