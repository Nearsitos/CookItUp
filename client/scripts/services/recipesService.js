// client/js/services/recipeService.js
const USE_MOCK = true; // flip to false when the backend exists

export async function getrecipe() {
  if (USE_MOCK) {
    const res = await fetch('./mock-data/recipe.json');
    return res.json();
  }
  const res = await fetch('/api/recipe');
  return res.json();
}

export async function addItem(item) {
  if (USE_MOCK) {
    // update in-memory state only
    return { ...item, id: crypto.randomUUID() };
  }
  const res = await fetch('/api/recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}