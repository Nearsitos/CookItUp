const foodEmojis = {avocado:'◉','baby spinach':'❧',eggs:'◯','feta cheese':'▧','greek yogurt':'◌',lemon:'◉',pasta:'≋',tomatoes:'◎',onion:'◎',rice:'⁙',chicken:'◈',garlic:'✣',bread:'▱',default:'◇'};
const $ = (selector) => document.querySelector(selector);
const state = { inventory: [], recipes: [], page: 'dashboard', search: '', sort: 'name', heroSlide: 1 };
const storageKey = 'cookitup-mvp-inventory';
const fallbackInventory = [
  {id:'food-1',name:'Avocado',quantity:2,calories:160,servingSize:100,unit:'piece'},
  {id:'food-2',name:'Baby spinach',quantity:1,calories:23,servingSize:100,unit:'bag'},
  {id:'food-3',name:'Eggs',quantity:6,calories:72,servingSize:50,unit:'piece'},
  {id:'food-4',name:'Feta cheese',quantity:1,calories:264,servingSize:100,unit:'block'},
  {id:'food-5',name:'Greek yogurt',quantity:1,calories:97,servingSize:100,unit:'tub'},
  {id:'food-6',name:'Lemon',quantity:2,calories:29,servingSize:100,unit:'piece'},
  {id:'food-7',name:'Pasta',quantity:1,calories:131,servingSize:100,unit:'box'},
  {id:'food-8',name:'Tomatoes',quantity:4,calories:18,servingSize:100,unit:'piece'}
];
const fallbackRecipes = [
  {id:'spinach-feta-omelet',name:'Spinach & feta omelet',time:15,category:'Breakfast',description:'A fluffy omelet filled with greens and salty feta.',ingredients:['Eggs','Baby spinach','Feta cheese'],steps:['Whisk the eggs.','Wilt spinach in a pan.','Cook the eggs gently and finish with feta.']},
  {id:'lemon-yogurt-pasta',name:'Creamy lemon yogurt pasta',time:20,category:'Dinner',description:'Bright lemon and tangy yogurt make a silky pasta sauce.',ingredients:['Pasta','Greek yogurt','Lemon','Feta cheese'],steps:['Cook the pasta.','Stir yogurt with lemon.','Toss together with a little pasta water and top with feta.']},
  {id:'tomato-spinach-pasta',name:'Tomato & spinach skillet pasta',time:25,category:'Dinner',description:'Cozy pasta with juicy tomatoes and tender greens.',ingredients:['Pasta','Tomatoes','Baby spinach','Lemon'],steps:['Cook the pasta.','Simmer chopped tomatoes.','Add spinach and pasta, then finish with lemon.']},
  {id:'avocado-yogurt-toast',name:'Avocado yogurt toast',time:10,category:'Lunch',description:'Creamy avocado, tangy yogurt, and bright lemon on toast.',ingredients:['Avocado','Greek yogurt','Lemon'],steps:['Toast bread.','Mash avocado with lemon.','Spread on toast and finish with yogurt.']},
  {id:'tomato-feta-salad',name:'Tomato & feta salad',time:10,category:'Lunch',description:'A fresh salad with crunchy greens and a lemony finish.',ingredients:['Tomatoes','Baby spinach','Feta cheese','Lemon'],steps:['Slice tomatoes and chop spinach.','Add feta.','Dress with lemon and olive oil.']}
];
let toastTimer;

async function loadData() {
  let starterLoaded = false;
  try {
    const [inventoryResponse, recipesResponse] = await Promise.all([fetch('./data/inventory.json'), fetch('./data/recipes.json')]);
    if (!inventoryResponse.ok || !recipesResponse.ok) throw new Error('Could not load starter data');
    state.inventory = await inventoryResponse.json();
    state.recipes = await recipesResponse.json();
    starterLoaded = true;
  } catch (error) {
    // Keep the prototype usable when opened directly as a file:// URL.
    state.inventory = structuredClone(fallbackInventory);
    state.recipes = structuredClone(fallbackRecipes);
  }
  const saved = loadSavedInventory();
  if (saved) state.inventory = saved;
  else if (!starterLoaded) saveInventory();
  render();
}

function loadSavedInventory() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.every((item) => item.name && Number.isFinite(Number(item.quantity))) ? parsed : null;
  } catch { return null; }
}
function saveInventory() {
  try { localStorage.setItem(storageKey, JSON.stringify(state.inventory)); } catch { /* The current session still works without browser storage. */ }
}

function emojiFor(name) { return foodEmojis[name.toLowerCase()] || foodEmojis.default; }
function normalized(value) { return String(value || '').trim().toLowerCase(); }
function availableNames() { return new Set(state.inventory.filter((item) => Number(item.quantity) > 0).map((item) => normalized(item.name))); }
function recipeMatch(recipe) {
  const have = availableNames();
  const hits = recipe.ingredients.filter((ingredient) => have.has(normalized(ingredient)));
  return { hits, missing: recipe.ingredients.length - hits.length, percent: Math.round(hits.length / recipe.ingredients.length * 100) };
}
function rankedRecipes() { return [...state.recipes].map((recipe) => ({ recipe, ...recipeMatch(recipe) })).sort((a, b) => b.percent - a.percent || a.missing - b.missing || a.recipe.time - b.recipe.time); }

function render() {
  renderDashboard();
  renderInventory();
  renderRecipes();
  $('#nav-count').textContent = state.inventory.length;
}
function renderDashboard() {
  $('#inventory-badge').textContent = `${state.inventory.length} Items`;
  $('#recipe-badge').textContent = `${rankedRecipes().filter((item) => item.hits.length > 0).length} Available`;
  renderHeroCarousel();
}
function renderHeroCarousel() {
  const ranked = rankedRecipes();
  const suggested = ranked.find((item) => item.hits.length > 0) || ranked[0];
  const image = suggested?.recipe.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85';
  const slides = [
    `<article class="featured-recipe"><div class="featured-photo" role="img" aria-label="Meal planning" style="background-image:url('${image}')"></div><div class="featured-copy"><div class="featured-kickers"><span class="pantry-match">YOUR PLANNED</span><span>Meal planning</span></div><h2>No meals planned yet</h2><p class="featured-ingredients">Plan recipes for the week and keep your household on the same page.</p><button class="button cook-button" data-go="recipes">Plan your first meal ↗</button></div></article>`,
    suggested ? `<article class="featured-recipe"><div class="featured-photo" role="img" aria-label="${escapeHtml(suggested.recipe.name)}" style="background-image:url('${image}')"></div><div class="featured-copy"><div class="featured-kickers"><span class="pantry-match">${suggested.percent}% PANTRY MATCH</span><span>A suggestion</span></div><h2>${escapeHtml(suggested.recipe.name)}</h2><p class="ingredient-caption">KEY INGREDIENTS FROM YOUR PANTRY:</p><p class="featured-ingredients">${suggested.recipe.ingredients.map(escapeHtml).join(', ')}</p><div class="featured-meta"><span>◷ &nbsp;${suggested.recipe.time} mins</span><span>♧ &nbsp;2 portions</span><span>♨ &nbsp;480 kcal</span></div><button class="button cook-button" data-recipe="${escapeHtml(suggested.recipe.id)}">Let's Cook ↗</button></div></article>` : '<article class="featured-recipe"><div class="featured-empty">Add ingredients to see a recipe suggestion.</div></article>',
    `<article class="featured-recipe future-slide"><div class="featured-photo" role="img" aria-label="Recipe ideas" style="background-image:url('${image}')"></div><div class="featured-copy"><div class="featured-kickers"><span class="pantry-match">MORE TO COME</span><span>CookItUp inspiration</span></div><h2>Your next idea is on its way.</h2><p class="featured-ingredients">This space is ready for another kind of cooking inspiration.</p><button class="button cook-button" data-go="recipes">Browse recipes ↗</button></div></article>`
  ];
  const track = $('#featured-track');
  track.innerHTML = slides.map((slide) => `<div class="hero-slide">${slide}</div>`).join('');
  $('#featured-dots').innerHTML = slides.map((_, index) => `<button type="button" class="carousel-dot${index === state.heroSlide ? ' selected' : ''}" data-slide="${index}" aria-label="Show highlight ${index + 1}" aria-current="${index === state.heroSlide ? 'true' : 'false'}"></button>`).join('');
  track.scrollLeft = track.clientWidth * state.heroSlide;
}
function selectHeroSlide(index) {
  const track = $('#featured-track');
  if (!track) return;
  state.heroSlide = Math.max(0, Math.min(2, index));
  track.scrollTo({ left: track.clientWidth * state.heroSlide, behavior: 'smooth' });
  updateHeroDots();
}
function updateHeroDots() {
  const track = $('#featured-track');
  if (track?.clientWidth) state.heroSlide = Math.round(track.scrollLeft / track.clientWidth);
  document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
    const selected = index === state.heroSlide;
    dot.classList.toggle('selected', selected);
    dot.setAttribute('aria-current', selected ? 'true' : 'false');
  });
}
function renderInventory() {
  const search = normalized(state.search);
  const items = state.inventory.filter((item) => normalized(item.name).includes(search)).sort((a, b) => state.sort === 'calories' ? Number(a.calories) - Number(b.calories) : state.sort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
  $('#inventory-body').innerHTML = items.map((item) => `<tr data-food-id="${escapeHtml(item.id)}"><td><span class="table-food"><span class="food-emoji">${emojiFor(item.name)}</span>${escapeHtml(item.name)}</span></td><td>${formatNumber(item.quantity)} ${escapeHtml(item.unit || 'qty')}</td><td>${formatNumber(item.calories)} kcal</td><td>${formatNumber(item.servingSize)} g</td><td><button class="delete-item" data-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">×</button></td></tr>`).join('');
  $('#inventory-empty').classList.toggle('hidden', items.length > 0);
  $('#inventory-footer').textContent = `Showing ${items.length} of ${state.inventory.length} ingredients`;
}
function renderRecipes() {
  const query = normalized($('#recipe-search').value);
  const recipes = rankedRecipes().filter(({ recipe }) => normalized(`${recipe.name} ${recipe.category} ${recipe.ingredients.join(' ')}`).includes(query));
  $('#match-caption').textContent = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} · sorted by pantry match`;
  $('#recipe-grid').innerHTML = recipes.map(({ recipe, hits, missing, percent }) => `<article class="recipe-card" data-recipe="${escapeHtml(recipe.id)}"><div class="recipe-cover" style="background-image:url('${recipe.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80'}')"><span class="recipe-badge">${missing ? `${missing} to get` : 'Ready to make'}</span></div><div class="recipe-body"><h3>${escapeHtml(recipe.name)}</h3><p>${escapeHtml(recipe.description)}</p><div class="recipe-tags"><span>${recipe.time} min · ${escapeHtml(recipe.category)}</span><span class="tag-score">${hits.length}/${recipe.ingredients.length} ingredients</span></div></div></article>`).join('') || '<div class="panel"><strong>No recipes match that search.</strong><p class="lede">Try another name or ingredient.</p></div>';
}
function formatNumber(value) { return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 }); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
function setPage(page) {
  state.page = page;
  document.querySelectorAll('.page').forEach((section) => section.classList.toggle('hidden', section.id !== `${page}-page`));
  document.querySelectorAll('.nav-link[data-page]').forEach((link) => link.classList.toggle('active', link.dataset.page === page));
  history.replaceState(null, '', `#${page}`);
  render();
}
function openAddDialog() {
  $('#form-error').textContent = '';
  $('#ingredient-dialog').showModal();
  $('#food-name').focus();
}
function openRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  const { hits, missing } = recipeMatch(recipe);
  $('#recipe-detail').innerHTML = `<button class="icon-button close-detail" aria-label="Close">×</button><div class="detail-photo" style="background-image:url('${recipe.image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85'}')" role="img" aria-label="${escapeHtml(recipe.name)}"></div><p class="eyebrow">${escapeHtml(recipe.category)} · ${recipe.time} MINUTES</p><h2>${escapeHtml(recipe.name)}</h2><p>${escapeHtml(recipe.description)}</p><p class="match-caption">You have ${hits.length} of ${recipe.ingredients.length} ingredients${missing ? ` · ${missing} still to get` : ' · ready to cook'}.</p><h3>Ingredients</h3><ul class="detail-ingredients">${recipe.ingredients.map((ingredient) => `<li>${availableNames().has(normalized(ingredient)) ? '✓' : '○'} ${escapeHtml(ingredient)}</li>`).join('')}</ul><h3>Method</h3><ol class="detail-steps">${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`;
  $('#recipe-dialog').showModal();
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-page]');
  if (nav) { event.preventDefault(); setPage(nav.dataset.page); }
  const go = event.target.closest('[data-go]');
  if (go) setPage(go.dataset.go);
  const slide = event.target.closest('[data-slide]');
  if (slide) selectHeroSlide(Number(slide.dataset.slide));
  if (event.target.closest('[data-action="add-ingredient"]')) { setPage('inventory'); openAddDialog(); }
  const recipeCard = event.target.closest('[data-recipe]');
  if (recipeCard) openRecipe(recipeCard.dataset.recipe);
  const remove = event.target.closest('[data-remove]');
  if (remove) { state.inventory = state.inventory.filter((item) => item.id !== remove.dataset.remove); saveInventory(); render(); showToast('Ingredient removed from your pantry.'); }
  if (event.target.closest('.close-detail')) $('#recipe-dialog').close();
});
$('#featured-track').addEventListener('scroll', updateHeroDots, { passive: true });
document.addEventListener('keydown', (event) => {
  const addCard = event.target.closest('[data-action="add-ingredient"]');
  if (addCard && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    setPage('inventory');
    openAddDialog();
  }
});
$('.menu-button').addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
$('#inventory-search').addEventListener('input', (event) => { state.search = event.target.value; renderInventory(); });
$('#inventory-sort').addEventListener('change', (event) => { state.sort = event.target.value; renderInventory(); });
$('#recipe-search').addEventListener('input', renderRecipes);
$('#global-search').addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const query = normalized(event.currentTarget.value);
  if (!query) return;
  if (state.recipes.some((recipe) => normalized(`${recipe.name} ${recipe.ingredients.join(' ')}`).includes(query))) {
    $('#recipe-search').value = event.currentTarget.value;
    setPage('recipes');
  } else {
    $('#inventory-search').value = event.currentTarget.value;
    state.search = event.currentTarget.value;
    setPage('inventory');
  }
});
$('#refresh-recipes').addEventListener('click', () => { renderRecipes(); showToast('Ideas refreshed from your pantry.'); });
$('#open-add').addEventListener('click', openAddDialog);
$('#close-dialog').addEventListener('click', () => $('#ingredient-dialog').close());
$('#cancel-dialog').addEventListener('click', () => $('#ingredient-dialog').close());
$('#ingredient-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name')).trim();
  if (!name) { $('#form-error').textContent = 'Enter an ingredient name.'; return; }
  const existing = state.inventory.find((item) => normalized(item.name) === normalized(name));
  if (existing) existing.quantity = Number(existing.quantity) + Number(form.get('quantity'));
  else state.inventory.push({ id: `food-${Date.now()}`, name, quantity: Number(form.get('quantity')), calories: Number(form.get('calories')), servingSize: Number(form.get('servingSize')), unit: 'qty' });
  saveInventory();
  const addedId = existing?.id || state.inventory[state.inventory.length - 1].id;
  $('#ingredient-dialog').close(); event.currentTarget.reset();
  $('#inventory-search').value = ''; state.search = ''; setPage('inventory');
  const addedRow = [...document.querySelectorAll('[data-food-id]')].find((row) => row.dataset.foodId === addedId);
  addedRow?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  addedRow?.classList.add('just-added');
  if (addedRow) setTimeout(() => addedRow.classList.remove('just-added'), 2200);
  showToast(existing ? `${name} quantity updated.` : `${name} added to your pantry.`);
});
$('#export-json').addEventListener('click', () => {
  const blob = new Blob([`${JSON.stringify(state.inventory, null, 2)}\n`], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'pantry-inventory.json'; link.click(); URL.revokeObjectURL(link.href);
});
$('#import-json').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported) || imported.some((item) => !item.name || !Number.isFinite(Number(item.quantity)) || !Number.isFinite(Number(item.calories)) || !Number.isFinite(Number(item.servingSize)))) throw new Error('Expected a JSON array with name, quantity, calories and servingSize fields.');
    state.inventory = imported.map((item, index) => ({ id: String(item.id || `import-${Date.now()}-${index}`), name: String(item.name).trim(), quantity: Number(item.quantity), calories: Number(item.calories), servingSize: Number(item.servingSize), unit: String(item.unit || 'qty') })); saveInventory(); $('#inventory-search').value = ''; state.search = ''; setPage('inventory'); showToast(`${state.inventory.length} ingredients imported.`);
  } catch (error) { showToast(`Import failed: ${error.message}`); }
  event.target.value = '';
});
$('#food-suggestions').innerHTML = ['Avocado','Baby spinach','Eggs','Feta cheese','Greek yogurt','Lemon','Pasta','Tomatoes','Onion','Rice','Chicken','Garlic','Bread'].map((name) => `<option value="${name}"></option>`).join('');
const initialPage = location.hash.slice(1);
loadData().then(() => { if (['dashboard', 'inventory', 'recipes', 'settings'].includes(initialPage)) setPage(initialPage); });
