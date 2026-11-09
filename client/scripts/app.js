import {
  daysUntil,
  expiryStatus,
  expiryLabel,
  isISODate,
  compareExpiry,
} from "./utils/dates.js";
import {
  ALLERGENS,
  DIETS,
  allergenLabel,
  checkRecipe,
  dietLabel,
  emptyPreferences,
} from "./dietary.js";
const foodEmojis = {
  avocado: "🥑",
  "baby spinach": "🥬",
  spinach: "🥬",
  eggs: "🥚",
  egg: "🥚",
  "feta cheese": "🧀",
  cheese: "🧀",
  "greek yogurt": "🥣",
  yogurt: "🥣",
  lemon: "🍋",
  pasta: "🍝",
  tomatoes: "🍅",
  tomato: "🍅",
  onion: "🧅",
  rice: "🍚",
  chicken: "🍗",
  beef: "🥩",
  garlic: "🧄",
  bread: "🍞",
  "olive oil": "🫒",
  honey: "🍯",
  default: "🧺",
};
// Rough calories/serving-size guesses for common ingredients, used to
// prefill the add-ingredient form while the user is still typing the name.
// These are ballpark figures, not nutrition facts — the user can always
// overwrite them, and anything not in this list is simply left blank.
const nutritionGuesses = {
  avocado: { calories: 160, servingSize: 100 },
  "baby spinach": { calories: 23, servingSize: 100 },
  spinach: { calories: 23, servingSize: 100 },
  eggs: { calories: 72, servingSize: 50 },
  egg: { calories: 72, servingSize: 50 },
  "feta cheese": { calories: 264, servingSize: 100 },
  "greek yogurt": { calories: 97, servingSize: 100 },
  yogurt: { calories: 97, servingSize: 100 },
  lemon: { calories: 29, servingSize: 100 },
  pasta: { calories: 131, servingSize: 100 },
  rice: { calories: 130, servingSize: 100 },
  tomatoes: { calories: 18, servingSize: 100 },
  tomato: { calories: 18, servingSize: 100 },
  onion: { calories: 40, servingSize: 100 },
  garlic: { calories: 149, servingSize: 100 },
  bread: { calories: 265, servingSize: 100 },
  chicken: { calories: 165, servingSize: 100 },
  beef: { calories: 250, servingSize: 100 },
  butter: { calories: 717, servingSize: 100 },
  milk: { calories: 42, servingSize: 100 },
  cheese: { calories: 350, servingSize: 100 },
  "olive oil": { calories: 884, servingSize: 100 },
  honey: { calories: 304, servingSize: 100 },
};
function guessNutrition(name) {
  const key = normalized(name);
  if (!key) return null;
  if (nutritionGuesses[key]) return nutritionGuesses[key];
  const match = Object.keys(nutritionGuesses).find((candidate) =>
    key.includes(candidate),
  );
  return match ? nutritionGuesses[match] : null;
}
const $ = (selector) => document.querySelector(selector);
const state = {
  inventory: [],
  recipes: [],
  page: "dashboard",
  search: "",
  sort: "expiry", // most expired first by default
  heroSlide: 1,
  prefs: emptyPreferences(),
  showHiddenRecipes: false,
};
const storageKey = "cookitup-mvp-inventory";
const preferencesKey = "cookitup-preferences";
const inventoryCategories = [
  "Meats & Protein",
  "Greens",
  "Grains",
  "Dairy",
  "Produce",
  "Seasonings",
  "Other",
];
// Where an ingredient is physically kept. This is a second, independent
// grouping from food type (inventoryCategories above) — the inventory page
// groups by storage location, while the add/edit dialog's "Food type" select
// still drives recipe matching and the emoji/keyword heuristics.
const storageLocations = [
  { id: "fridge", label: "Refrigerated", icon: "fridge" },
  { id: "freezer", label: "Frozen", icon: "freezer" },
  { id: "pantry", label: "Room temperature", icon: "pantry" },
  { id: "other", label: "Other", icon: "other" },
];
function storageLocation(item) {
  const explicit = storageLocations.find(
    (location) => location.id === normalized(item?.storage),
  );
  if (explicit) return explicit.id;
  const name = normalized(typeof item === "string" ? item : item.name);
  if (/\bfrozen\b/.test(name)) return "freezer";
  const category = inventoryCategory(item);
  if (["Dairy", "Meats & Protein", "Greens", "Produce"].includes(category))
    return "fridge";
  if (["Grains", "Seasonings"].includes(category)) return "pantry";
  return "other";
}
// Thin outline icons (not emoji) that identify each storage card at a
// glance. They inherit color from the card via `currentColor`.
const storageIcons = {
  fridge:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"></rect><line x1="5" y1="10" x2="19" y2="10"></line><line x1="8" y1="5" x2="8" y2="7"></line><line x1="8" y1="13" x2="8" y2="15"></line></svg>',
  freezer:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="4" y1="7" x2="20" y2="17"></line><line x1="20" y1="7" x2="4" y2="17"></line></svg>',
  pantry:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg>',
  other:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 L11 3 H19 V11 L11 19 Z"></path><circle cx="15" cy="7" r="1.4" fill="currentColor" stroke="none"></circle></svg>',
};
const fallbackInventory = [
  {
    id: "food-1",
    name: "Avocado",
    quantity: 2,
    calories: 160,
    servingSize: 100,
    unit: "piece",
  },
  {
    id: "food-2",
    name: "Baby spinach",
    quantity: 1,
    calories: 23,
    servingSize: 100,
    unit: "bag",
  },
  {
    id: "food-3",
    name: "Eggs",
    quantity: 6,
    calories: 72,
    servingSize: 50,
    unit: "piece",
  },
  {
    id: "food-4",
    name: "Feta cheese",
    quantity: 1,
    calories: 264,
    servingSize: 100,
    unit: "block",
  },
  {
    id: "food-5",
    name: "Greek yogurt",
    quantity: 1,
    calories: 97,
    servingSize: 100,
    unit: "tub",
  },
  {
    id: "food-6",
    name: "Lemon",
    quantity: 2,
    calories: 29,
    servingSize: 100,
    unit: "piece",
  },
  {
    id: "food-7",
    name: "Pasta",
    quantity: 1,
    calories: 131,
    servingSize: 100,
    unit: "box",
  },
  {
    id: "food-8",
    name: "Tomatoes",
    quantity: 4,
    calories: 18,
    servingSize: 100,
    unit: "piece",
  },
];
const fallbackRecipes = [
  {
    id: "spinach-feta-omelet",
    name: "Spinach & feta omelet",
    time: 15,
    category: "Breakfast",
    description: "A fluffy omelet filled with greens and salty feta.",
    ingredients: ["Eggs", "Baby spinach", "Feta cheese"],
    steps: [
      "Whisk the eggs.",
      "Wilt spinach in a pan.",
      "Cook the eggs gently and finish with feta.",
    ],
  },
  {
    id: "lemon-yogurt-pasta",
    name: "Creamy lemon yogurt pasta",
    time: 20,
    category: "Dinner",
    description: "Bright lemon and tangy yogurt make a silky pasta sauce.",
    ingredients: ["Pasta", "Greek yogurt", "Lemon", "Feta cheese"],
    steps: [
      "Cook the pasta.",
      "Stir yogurt with lemon.",
      "Toss together with a little pasta water and top with feta.",
    ],
  },
  {
    id: "tomato-spinach-pasta",
    name: "Tomato & spinach skillet pasta",
    time: 25,
    category: "Dinner",
    description: "Cozy pasta with juicy tomatoes and tender greens.",
    ingredients: ["Pasta", "Tomatoes", "Baby spinach", "Lemon"],
    steps: [
      "Cook the pasta.",
      "Simmer chopped tomatoes.",
      "Add spinach and pasta, then finish with lemon.",
    ],
  },
  {
    id: "avocado-yogurt-toast",
    name: "Avocado yogurt toast",
    time: 10,
    category: "Lunch",
    description: "Creamy avocado, tangy yogurt, and bright lemon on toast.",
    ingredients: ["Avocado", "Greek yogurt", "Lemon", "Bread"],
    steps: [
      "Toast bread.",
      "Mash avocado with lemon.",
      "Spread on toast and finish with yogurt.",
    ],
  },
  {
    id: "tomato-feta-salad",
    name: "Tomato & feta salad",
    time: 10,
    category: "Lunch",
    description: "A fresh salad with crunchy greens and a lemony finish.",
    ingredients: ["Tomatoes", "Baby spinach", "Feta cheese", "Lemon"],
    steps: [
      "Slice tomatoes and chop spinach.",
      "Add feta.",
      "Dress with lemon and olive oil.",
    ],
  },
];
let toastTimer;
let editingItemId = null;

async function loadData() {
  let starterLoaded = false;
  state.prefs = loadPreferences();
  try {
    const [inventoryResponse, recipesResponse] = await Promise.all([
      fetch("./data/inventory.json"),
      fetch("./data/recipes.json"),
    ]);
    if (!inventoryResponse.ok || !recipesResponse.ok)
      throw new Error("Could not load starter data");
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
    return Array.isArray(parsed) &&
      parsed.every(
        (item) => item.name && Number.isFinite(Number(item.quantity)),
      )
      ? parsed
      : null;
  } catch {
    return null;
  }
}
function saveInventory() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state.inventory));
  } catch {
    /* The current session still works without browser storage. */
  }
}

// --- Dietary preferences: saved per browser, like the inventory. ----------
function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey));
    const known = (list, options) =>
      Array.isArray(list)
        ? list.filter((id) => options.some((option) => option.id === id))
        : [];
    return {
      diets: known(saved?.diets, DIETS),
      allergies: known(saved?.allergies, ALLERGENS),
    };
  } catch {
    return emptyPreferences();
  }
}
function savePreferences() {
  try {
    localStorage.setItem(preferencesKey, JSON.stringify(state.prefs));
  } catch {
    /* Preferences still apply for this session without browser storage. */
  }
}
function preferenceCount() {
  return state.prefs.diets.length + state.prefs.allergies.length;
}
function preferenceSummary() {
  const parts = [];
  if (state.prefs.diets.length)
    parts.push(state.prefs.diets.map(dietLabel).join(", "));
  if (state.prefs.allergies.length)
    parts.push(
      `avoiding ${state.prefs.allergies.map((id) => allergenLabel(id).toLowerCase()).join(", ")}`,
    );
  const text = parts.join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function emojiFor(name) {
  return foodEmojis[name.toLowerCase()] || foodEmojis.default;
}
function normalized(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function inventoryCategory(item) {
  const explicit = inventoryCategories.find(
    (category) => normalized(category) === normalized(item.category),
  );
  if (explicit) return explicit;
  const name = normalized(typeof item === "string" ? item : item.name);
  if (/\b(chicken|beef|pork|turkey|bacon|sausage|fish|salmon|tuna|shrimp|meat|egg|eggs)\b/.test(name))
    return "Meats & Protein";
  if (/\b(spinach|lettuce|kale|arugula|chard|collard|greens)\b/.test(name))
    return "Greens";
  if (/\b(pasta|rice|quinoa|oats|bread|flour|barley|couscous|grain|cereal)\b/.test(name))
    return "Grains";
  if (/\b(cheese|milk|yogurt|butter|cream|dairy)\b/.test(name))
    return "Dairy";
  if (/\b(salt|black pepper|white pepper|peppercorn|spice|seasoning|garlic|basil|oregano|paprika|cumin|thyme|rosemary|cilantro|parsley|chili|oil|vinegar|sauce)\b/.test(name))
    return "Seasonings";
  if (/\b(avocado|tomato|tomatoes|lemon|lime|onion|potato|carrot|apple|banana|pepper|peppers|broccoli|cucumber|fruit|vegetable)\b/.test(name))
    return "Produce";
  return "Other";
}
function availableNames() {
  return new Set(
    state.inventory
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => normalized(item.name)),
  );
}
function recipeMatch(recipe) {
  const have = availableNames();
  const hits = recipe.ingredients.filter((ingredient) =>
    have.has(normalized(ingredient)),
  );
  return {
    hits,
    missing: recipe.ingredients.length - hits.length,
    percent: Math.round((hits.length / recipe.ingredients.length) * 100),
  };
}
// Every recipe, with its pantry match and dietary check. Recipes that fit the
// user's preferences come first, then diet conflicts, then allergen hits.
function rankedRecipes() {
  return [...state.recipes]
    .map((recipe) => ({
      recipe,
      ...recipeMatch(recipe),
      diet: checkRecipe(recipe, state.prefs),
    }))
    .sort(
      (a, b) =>
        Number(a.diet.hidden) - Number(b.diet.hidden) ||
        Number(a.diet.flagged) - Number(b.diet.flagged) ||
        b.percent - a.percent ||
        a.missing - b.missing ||
        a.recipe.time - b.recipe.time,
    );
}
// Recipes that are safe for the user's allergies.
function allowedRecipes() {
  return rankedRecipes().filter((item) => !item.diet.hidden);
}
function dietFlagsHtml(diet) {
  return [
    ...diet.allergens.map(
      (id) =>
        `<span class="diet-flag diet-flag--allergen">⚠ Contains ${escapeHtml(allergenLabel(id).toLowerCase())}</span>`,
    ),
    ...diet.dietConflicts.map(
      (id) =>
        `<span class="diet-flag diet-flag--diet">Not ${escapeHtml(dietLabel(id).toLowerCase())}</span>`,
    ),
  ].join("");
}

function render() {
  renderDashboard();
  renderInventory();
  renderRecipes();
  renderPreferences();
  $("#nav-count").textContent = state.inventory.length;
}
function renderDashboard() {
  $("#inventory-badge").textContent = `${state.inventory.length} Items`;
  renderExpiryCard();
  $("#recipe-badge").textContent =
    `${rankedRecipes().filter((item) => item.diet.fits && item.hits.length > 0).length} Available`;
  const count = preferenceCount();
  const prefsBadge = $("#prefs-badge");
  prefsBadge.textContent = `${count} Active`;
  prefsBadge.classList.toggle("hidden", count === 0);
  renderHeroCarousel();
}
function renderHeroCarousel() {
  // Never suggest a recipe with the user's allergens; prefer ones that also
  // fit their diet.
  const ranked = allowedRecipes();
  const suggested =
    ranked.find((item) => item.hits.length > 0 && !item.diet.flagged) ||
    ranked.find((item) => item.hits.length > 0) ||
    ranked[0];
  const image =
    suggested?.recipe.image ||
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85";
  const slides = [
    `
      <article class="featured-recipe">
        <div class="featured-photo" role="img" aria-label="Meal planning" style="background-image:url('${image}')"></div>
        <div class="featured-copy">
          <div class="featured-kickers"><span class="pantry-match">YOUR PLANNED</span><span>Meal planning</span></div>
          <h2>No meals planned yet</h2>
          <p class="featured-ingredients">Plan recipes for the week and keep your household on the same page.</p>
          <button class="button cook-button" data-go="recipes">Plan your first meal ↗</button>
        </div>
      </article>
    `,
    suggested
      ? `
        <article class="featured-recipe featured-recipe--suggested">
          <div class="featured-photo" role="img" aria-label="${escapeHtml(suggested.recipe.name)}" style="background-image:url('${image}')"></div>
          <div class="featured-copy">
            <div class="featured-kickers"><span class="pantry-match">${suggested.percent}% PANTRY MATCH</span><span>A suggestion</span>${dietFlagsHtml(suggested.diet)}</div>
            <h2>${escapeHtml(suggested.recipe.name)}</h2>
            <p class="ingredient-caption">KEY INGREDIENTS FROM YOUR PANTRY:</p>
            <p class="featured-ingredients">${suggested.recipe.ingredients.map(escapeHtml).join(", ")}</p>
            <div class="featured-meta"><span>◷ &nbsp;${suggested.recipe.time} mins</span><span>♧ &nbsp;${Number(suggested.recipe.servings || 2)} portions</span><span>♨ &nbsp;${formatNumber(Number(suggested.recipe.calories || 400))} kcal</span></div>
            <button class="button cook-button cook-button--compact" data-recipe="${escapeHtml(suggested.recipe.id)}">Let's Cook ↗</button>
          </div>
        </article>
      `
      : `<article class="featured-recipe"><div class="featured-empty">${
          state.recipes.length
            ? "No recipes fit your allergies yet. Check back as more recipes are added."
            : "Add ingredients to see a recipe suggestion."
        }</div></article>`,
    `
      <article class="featured-recipe future-slide">
        <div class="featured-photo" role="img" aria-label="Recipe ideas" style="background-image:url('${image}')"></div>
        <div class="featured-copy">
          <div class="featured-kickers"><span class="pantry-match">MORE TO COME</span><span>CookItUp inspiration</span></div>
          <h2>Your next idea is on its way.</h2>
          <p class="featured-ingredients">This space is ready for another kind of cooking inspiration.</p>
          <button class="button cook-button" data-go="recipes">Browse recipes ↗</button>
        </div>
      </article>
    `,
  ];
  const track = $("#featured-track");
  track.innerHTML = slides
    .map((slide) => `<div class="hero-slide">${slide}</div>`)
    .join("");
  $("#featured-dots").innerHTML = slides
    .map(
      (_, index) =>
        `<button type="button" class="carousel-dot${index === state.heroSlide ? " selected" : ""}" data-slide="${index}" aria-label="Show highlight ${index + 1}" aria-current="${index === state.heroSlide ? "true" : "false"}"><span class="carousel-dot-fill" aria-hidden="true"></span></button>`,
    )
    .join("");
  track.scrollLeft = track.clientWidth * state.heroSlide;
  syncHeroControls();
  resetHeroAutoplayProgress();
}
function selectHeroSlide(index, { resetProgress = true, userInitiated = false } = {}) {
  const track = $("#featured-track");
  if (!track) return;
  state.heroSlide = Math.max(0, Math.min(2, index));
  heroScrollTarget = state.heroSlide;
  track.scrollTo({
    left: track.clientWidth * state.heroSlide,
    behavior: "smooth",
  });
  syncHeroControls();
  if (userInitiated) {
    heroResumeAt = Date.now() + 20000;
    resetHeroAutoplayProgress();
  } else if (resetProgress) {
    resetHeroAutoplayProgress();
  }
}
// While a control-triggered smooth scroll is running, ignore the in-between
// scroll positions so the selection doesn't flicker back.
let heroScrollTarget = null;
const HERO_SLIDE_COUNT = 3;
const HERO_AUTOPLAY_SECONDS = 7;
let heroElapsedSeconds = 0;
let heroResumeAt = 0;
let heroAutoplayTimer = null;
function updateHeroProgress(reset = false) {
  const fills = [...document.querySelectorAll(".carousel-dot-fill")];
  if (!fills.length) return;
  const percent = (heroElapsedSeconds / HERO_AUTOPLAY_SECONDS) * 100;
  if (reset) {
    fills.forEach((fill) => {
      fill.style.transition = "none";
      fill.style.width = "0%";
    });
    fills[state.heroSlide]?.getBoundingClientRect();
    fills.forEach((fill) => { fill.style.transition = ""; });
  } else {
    fills.forEach((fill, index) => {
      fill.style.width = index === state.heroSlide ? `${percent}%` : "0%";
    });
  }
}
function resetHeroAutoplayProgress() {
  heroElapsedSeconds = 0;
  updateHeroProgress(true);
}
function startHeroAutoplay() {
  if (heroAutoplayTimer) clearInterval(heroAutoplayTimer);
  heroAutoplayTimer = setInterval(() => {
    if (
      Date.now() < heroResumeAt ||
      document.hidden ||
      state.page !== "dashboard" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    heroElapsedSeconds += 1;
    updateHeroProgress();
    if (heroElapsedSeconds >= HERO_AUTOPLAY_SECONDS) {
      selectHeroSlide((state.heroSlide + 1) % HERO_SLIDE_COUNT, { resetProgress: false });
      resetHeroAutoplayProgress();
    }
  }, 1000);
}
function updateHeroDots() {
  const track = $("#featured-track");
  if (track?.clientWidth) {
    const visible = Math.round(track.scrollLeft / track.clientWidth);
    if (heroScrollTarget !== null && visible !== heroScrollTarget) return;
    heroScrollTarget = null;
    const changed = visible !== state.heroSlide;
    state.heroSlide = visible;
    if (changed) {
      heroResumeAt = Date.now() + 20000;
      resetHeroAutoplayProgress();
    }
  }
  syncHeroControls();
}
function syncHeroControls() {
  const slideLabels = ["Your planned", "A suggestion", "More to come"];
  document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
    const selected = index === state.heroSlide;
    dot.classList.toggle("selected", selected);
    dot.setAttribute("aria-current", selected ? "true" : "false");
    // Roving tabindex: Tab lands on the current dot; arrow keys move between.
    dot.tabIndex = selected ? 0 : -1;
  });
  // Off-screen slides are inert so Tab can't land on their hidden buttons.
  document.querySelectorAll(".hero-slide").forEach((slide, index) => {
    slide.inert = index !== state.heroSlide;
  });
  $("#featured-status").textContent =
    `${slideLabels[state.heroSlide]} · ${state.heroSlide + 1} of ${slideLabels.length}`;
}

// Compact version for the inventory cards: only "soon" and "expired" show a
// badge, so a fresh (the common case) item stays a single quiet line.
function expiryBadgeCompact(item) {
  if (!item.expiryDate) return "";
  const status = expiryStatus(daysUntil(item.expiryDate));
  if (status !== "soon" && status !== "expired") return "";
  return `<span class="expiry-badge expiry-badge--${status}">${expiryLabel(daysUntil(item.expiryDate))}</span>`;
}
// Splits "2 piece" into a bigger number and a smaller unit word.
function splitQty(quantity, unit) {
  const num = formatNumber(quantity);
  return unit ? `${num}<small>${escapeHtml(unit)}</small>` : num;
}

// Items in stock that have expired or expire within 3 days.
function expiryAlerts() {
  const counts = { expired: 0, soon: 0 };
  for (const item of state.inventory) {
    if (!item.expiryDate || Number(item.quantity) <= 0) continue;
    const status = expiryStatus(daysUntil(item.expiryDate));
    if (status in counts) counts[status] += 1;
  }
  return counts;
}
function renderExpiryCard() {
  const { expired, soon } = expiryAlerts();
  const total = expired + soon;
  const plural = (n) => `${n} item${n === 1 ? "" : "s"}`;
  $("#expiry-alert-badge").textContent = total
    ? `${total} Alert${total === 1 ? "" : "s"}`
    : "All fresh";
  const parts = [];
  if (expired) parts.push(`${plural(expired)} expired`);
  if (soon) parts.push(`${plural(soon)} expiring within 3 days`);
  $("#expiry-summary").textContent = total
    ? `${parts.join(", ")}. Use them first or clear them out.`
    : "Nothing is expiring soon. Add expiry dates to keep track.";
}


function renderInventory() {
  // The grid is about to be rebuilt, so any row a swipe gesture still
  // references is going away — forget it rather than hold a detached node.
  openSwipeRow = null;
  swipeRow = null;
  const search = normalized(state.search);
  const items = state.inventory
    .filter((item) =>
      normalized(`${item.name} ${inventoryCategory(item)}`).includes(search),
    )
    .sort((a, b) => {
      if (state.sort === "expiry") {
        return compareExpiry(a.expiryDate, b.expiryDate) || a.name.localeCompare(b.name);
      }
      if (state.sort === "calories") {
        if (a.calories == null) return 1;
        if (b.calories == null) return -1;
        return Number(a.calories) - Number(b.calories);
      }
      return state.sort === "name-desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    });
  // Cards stay in a fixed fridge/freezer/pantry/other order — sorting only
  // reorders the ingredients inside each card, not the cards themselves.
  const groups = storageLocations.map((location) => ({
    location,
    items: items.filter((item) => storageLocation(item) === location.id),
  }));
  $("#inventory-grid").innerHTML = groups
    .map(({ location, items: locationItems }) => {
      const rows = locationItems
        .map(
          (item) =>
            `<div class="storage-row" data-food-id="${escapeHtml(item.id)}">
              <div class="storage-row-swipe-actions" aria-hidden="true">
                <button type="button" class="storage-swipe-edit" data-edit="${escapeHtml(item.id)}">Edit</button>
                <button type="button" class="storage-swipe-delete" data-remove="${escapeHtml(item.id)}">Delete</button>
              </div>
              <div class="storage-row-content">
                <button type="button" class="storage-row-name" data-edit="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.name)}">
                  <span class="storage-row-emoji">${emojiFor(item.name)}</span>
                  <span>${escapeHtml(item.name)}</span>
                </button>
                <div class="storage-row-expiry">${expiryBadgeCompact(item)}</div>
                <div class="storage-row-qty">${splitQty(item.quantity, item.unit)}</div>
                <div class="storage-row-actions">
                  <button class="edit-item" data-edit="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.name)}">✎</button>
                  <button class="delete-item" data-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
                </div>
              </div>
            </div>`,
        )
        .join("");
      const empty = locationItems.length
        ? ""
        : `<p class="storage-card-empty">${search ? "No matches" : "No items yet"}</p>`;
      return `<section class="storage-card storage-card--${location.id}">
        <div class="storage-card-bar"></div>
        <div class="storage-card-header">
          <div class="storage-card-title">
            <span class="storage-card-icon">${storageIcons[location.icon]}</span>
            <h2>${escapeHtml(location.label)}</h2>
          </div>
          <span class="storage-card-count">${locationItems.length} items</span>
        </div>
        <div class="storage-card-items">${rows}${empty}</div>
        <button type="button" class="storage-card-add" data-add-storage="${location.id}">+ Add ingredient</button>
      </section>`;
    })
    .join("");
  $("#inventory-footer").textContent =
    `Showing ${items.length} of ${state.inventory.length} ingredients`;
}
function renderRecipes() {
  const query = normalized($("#recipe-search").value);
  const matching = rankedRecipes().filter(({ recipe }) =>
    normalized(
      `${recipe.name} ${recipe.category} ${recipe.ingredients.join(" ")}`,
    ).includes(query),
  );
  // Only recipes that fit every preference show by default. "Show them"
  // brings the rest back, tagged with what doesn't fit.
  const outside = matching.filter((item) => !item.diet.fits);
  const recipes = state.showHiddenRecipes
    ? matching
    : matching.filter((item) => item.diet.fits);
  $("#match-caption").textContent =
    `${recipes.length} recipe${recipes.length === 1 ? "" : "s"} · sorted by pantry match${preferenceCount() ? " and your preferences" : ""}`;
  renderRecipeNotice(outside);
  $("#recipe-grid").innerHTML =
    recipes
      .map(
        ({ recipe, hits, missing, diet }) =>
          `<article class="recipe-card${diet.hidden ? " recipe-card--allergen" : ""}" data-recipe="${escapeHtml(recipe.id)}" role="button" tabindex="0" aria-label="${escapeHtml(recipe.name)}${diet.hidden || diet.flagged ? ` (${[...diet.allergens.map((id) => `contains ${allergenLabel(id).toLowerCase()}`), ...diet.dietConflicts.map((id) => `not ${dietLabel(id).toLowerCase()}`)].join(", ")})` : ""}, ${missing ? `${missing} to get` : "ready to make"}"><div class="recipe-cover" style="background-image:url('${recipe.image || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80"}')"><span class="recipe-badge">${missing ? `${missing} to get` : "Ready to make"}</span></div><div class="recipe-body"><h3>${escapeHtml(recipe.name)}</h3><p>${escapeHtml(recipe.description)}</p>${diet.hidden || diet.flagged ? `<div class="diet-flags">${dietFlagsHtml(diet)}</div>` : ""}<div class="recipe-tags"><span>${recipe.time} min · ${escapeHtml(recipe.category)}</span><span class="tag-score">${hits.length}/${recipe.ingredients.length} ingredients</span></div></div></article>`,
      )
      .join("") ||
    (outside.length
      ? '<div class="panel"><strong>None of these recipes fit your preferences yet.</strong><p class="lede">Use “Show them” above to see them anyway.</p></div>'
      : '<div class="panel"><strong>No recipes match that search.</strong><p class="lede">Try another name or ingredient.</p></div>');
}
// The strip above the recipe grid: what's filtered, and the show/hide option.
function renderRecipeNotice(outside) {
  const notice = $("#recipe-pref-notice");
  if (!preferenceCount()) {
    notice.classList.add("hidden");
    return;
  }
  const count = outside.length;
  const allergenCount = outside.filter((item) => item.diet.hidden).length;
  const dietCount = count - allergenCount;
  // e.g. "2 don't fit your diet, 1 has your allergens"
  const reasons = [
    dietCount
      ? `${dietCount} ${dietCount === 1 ? "doesn't" : "don't"} fit your diet`
      : "",
    allergenCount
      ? `${allergenCount} ${allergenCount === 1 ? "has" : "have"} your allergens`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  let message;
  let action = "";
  if (count && !state.showHiddenRecipes) {
    message = `<strong>${count} recipe${count === 1 ? " is" : "s are"} hidden</strong> (${reasons}).`;
    action = `<button class="text-button" data-action="toggle-hidden-recipes">Show them</button>`;
  } else if (count) {
    message = `<strong>Showing ${count} recipe${count === 1 ? "" : "s"} outside your preferences</strong>, tagged with what doesn't fit.`;
    action = `<button class="text-button" data-action="toggle-hidden-recipes">Hide them</button>`;
  } else {
    message = `<strong>Matched to your preferences:</strong> ${escapeHtml(preferenceSummary())}.`;
  }
  notice.innerHTML = `<span class="pref-notice-icon" aria-hidden="true">⛨</span><p>${message}</p>${action}<button class="text-button" data-go="preferences">Edit</button>`;
  notice.classList.remove("hidden");
}
// --- Preferences page --------------------------------------------------------
// The checkboxes are built once; render only syncs their state, so keyboard
// focus isn't lost when a preference changes.
function buildPreferenceOptions() {
  const option = (kind, item, extra = "") =>
    `<label class="chip chip--${kind}"><input type="checkbox" data-pref-kind="${kind}" value="${item.id}" /><span class="chip-face"><span class="chip-check" aria-hidden="true"></span><span class="chip-text"><strong>${escapeHtml(item.label)}</strong>${extra}</span></span></label>`;
  $("#allergy-options").innerHTML = ALLERGENS.map((item) =>
    option("allergies", item),
  ).join("");
  $("#diet-options").innerHTML = DIETS.map((item) =>
    option("diets", item, `<small>${escapeHtml(item.hint)}</small>`),
  ).join("");
}
function renderPreferences() {
  document.querySelectorAll("[data-pref-kind]").forEach((input) => {
    input.checked = state.prefs[input.dataset.prefKind].includes(input.value);
  });
  const all = rankedRecipes();
  const hidden = all.filter((item) => item.diet.hidden).length;
  const flagged = all.filter((item) => item.diet.flagged).length;
  const fits = all.length - hidden - flagged;
  const count = preferenceCount();
  $("#pref-summary-title").textContent = count
    ? preferenceSummary()
    : "No preferences set yet";
  $("#pref-summary").textContent = count
    ? `${fits} of ${all.length} recipes fit you${flagged ? `; ${flagged} ${flagged === 1 ? "doesn't" : "don't"} fit your diet` : ""}${hidden ? `; ${hidden} ${hidden === 1 ? "has" : "have"} your allergens` : ""}.`
    : `All ${all.length} recipes are shown. Pick anything that applies to you above.`;
  $("#clear-preferences").disabled = count === 0;
  $("#diet-setting-summary").textContent = count
    ? preferenceSummary()
    : "Get ideas that fit your way of eating.";
}
function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}
function optionalNumber(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
const primaryNavigation = $("#primary-navigation");
// moveFocus: when the user navigates, put focus on the new page's heading so
// keyboard and screen-reader users start at the top of the content.
function setPage(page, { moveFocus = false } = {}) {
  state.page = page;
  document
    .querySelectorAll(".page")
    .forEach((section) =>
      section.classList.toggle("hidden", section.id !== `${page}-page`),
    );
  primaryNavigation.querySelectorAll(".nav-link[data-page]").forEach((link) => {
    const isCurrent =
      link.dataset.page === (page === "preferences" ? "settings" : page);
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  history.replaceState(null, "", `#${page}`);
  render();
  if (moveFocus) focusPageHeading();
}
function focusPageHeading() {
  const heading = $(`#${state.page}-page h1`);
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus();
  scrollTo({ top: 0 });
}
function openAddDialog(storageId) {
  editingItemId = null;
  $("#ingredient-form").reset();
  $('[name="calories"]').classList.remove("is-estimated");
  $('[name="servingSize"]').classList.remove("is-estimated");
  if (storageId) $("#food-storage").value = storageId;
  $("#ingredient-submit").textContent = "Add ingredient";
  $("#form-error").textContent = "";
  $("#ingredient-dialog").showModal();
  $("#food-name").focus();
  $("#dialog-title").textContent = "New ingredient";
}

// Ask "Are you sure?" before deleting an ingredient. Only removes it if the
// user clicks Delete; Cancel or Escape leaves it alone.
function confirmRemove(button) {
  const id = button.dataset.remove;
  const item = state.inventory.find((entry) => entry.id === id);
  const dialog = $("#confirm-delete-dialog");
  $("#confirm-delete-message").textContent = item
    ? `${item.name} will be removed from your pantry.`
    : "This ingredient will be removed from your pantry.";
  dialog.returnValue = "";
  dialog.addEventListener(
    "close",
    () => {
      if (dialog.returnValue !== "confirm") {
        button.focus();
        return;
      }
      // Remember the row position so focus can move to the next row's button
      // instead of being lost when this row disappears.
      const buttons = [...document.querySelectorAll("[data-remove]")];
      const index = buttons.indexOf(button);
      state.inventory = state.inventory.filter((entry) => entry.id !== id);
      saveInventory();
      render();
      const remaining = document.querySelectorAll("[data-remove]");
      (remaining[Math.min(index, remaining.length - 1)] || $("#inventory-search")).focus();
      showToast("Ingredient removed from your pantry.");
    },
    { once: true },
  );
  dialog.showModal();
}

function openEditDialog(id) {
  const item = state.inventory.find((item) => item.id === id);
  if (!item) return;

  editingItemId = id;

  $("#food-name").value = item.name;
  $("#food-category").value = inventoryCategory(item);
  $("#food-storage").value = storageLocation(item);
  $('[name="quantity"]').value = item.quantity;
  $('[name="servingSize"]').value = item.servingSize ?? "";
  $('[name="servingSize"]').classList.remove("is-estimated");
  $('[name="calories"]').value = item.calories ?? "";
  $('[name="calories"]').classList.remove("is-estimated");
  $('[name="expiryDate"]').value = item.expiryDate ?? "";
  $("#ingredient-submit").textContent = "Save changes";
  $("#form-error").textContent = "";
  $("#ingredient-dialog").showModal();
  $("#food-name").focus();
  $("#dialog-title").textContent = "Edit ingredient";
}

function openRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  const { hits, missing } = recipeMatch(recipe);
  const pantry = availableNames();
  const ingredientsOnHand = recipe.ingredients.filter((item) =>
    pantry.has(normalized(item)),
  );
  const ingredientsToGet = recipe.ingredients.filter(
    (item) => !pantry.has(normalized(item)),
  );
  const diet = checkRecipe(recipe, state.prefs);
  const dietWarning =
    diet.hidden || diet.flagged
      ? `<div class="diet-flags diet-flags--detail">${dietFlagsHtml(diet)}</div>`
      : "";
  const ingredientLine = (ingredient) => {
    const mark = availableNames().has(normalized(ingredient)) ? "✓" : "○";
    const note = diet.ingredientNotes.get(ingredient);
    const flags = note
      ? [
          ...note.allergens.map(
            (id) =>
              `<span class="ingredient-flag ingredient-flag--allergen">⚠ ${escapeHtml(allergenLabel(id).toLowerCase())}</span>`,
          ),
          ...note.diets.map(
            (id) =>
              `<span class="ingredient-flag ingredient-flag--diet">not ${escapeHtml(dietLabel(id).toLowerCase())}</span>`,
          ),
        ].join("")
      : "";
    return `${mark} ${escapeHtml(ingredient)}${flags}`;
  };
  const ingredientList = (ingredients, className = "") =>
    `<ul class="detail-ingredients ${className}">${ingredients
      .map((ingredient) => `<li>${ingredientLine(ingredient)}</li>`)
      .join("")}</ul>`;
  const missingIngredientsSection = ingredientsToGet.length
    ? `<section class="recipe-section recipe-section--missing">
        <h3>Missing ingredients</h3>
        ${ingredientList(ingredientsToGet, "ingredient-list--missing")}
      </section>`
    : "";
  const servingCount = Number(recipe.servings || 2);
  const calorieCount = Number(recipe.calories || 400);
  $("#recipe-detail").innerHTML =
    `<button class="icon-button close-detail" aria-label="Close recipe">×</button>
      <div class="recipe-visual">
        <div class="detail-photo" style="background-image:url('${recipe.image || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1100&q=85"}')" role="img" aria-label="${escapeHtml(recipe.name)}"></div>
        <span class="recipe-time-badge">◷ &nbsp;${recipe.time} minutes</span>
        <div class="recipe-photo-meta"><span>♧ &nbsp;${servingCount} servings</span><span>♨ &nbsp;${formatNumber(calorieCount)} kcal</span></div>
      </div>
      <div class="recipe-content">
        <header class="recipe-summary">
          <p class="eyebrow">${escapeHtml(recipe.category)}</p>
          <h2>${escapeHtml(recipe.name)}</h2>
          <p>${escapeHtml(recipe.description)}</p>
          <p class="match-caption">You have ${hits.length} of ${recipe.ingredients.length} ingredients${missing ? ` · ${missing} still to get` : " · ready to cook"}.</p>
          ${dietWarning}
        </header>
        <section class="recipe-section">
          <h3>Ingredients</h3>
          ${ingredientsOnHand.length ? ingredientList(ingredientsOnHand, "ingredient-list--available") : '<p class="ingredient-empty">None of these ingredients are in your inventory yet.</p>'}
        </section>
        ${missingIngredientsSection}
        <section class="recipe-section recipe-section--steps">
          <h3>Steps</h3>
          <ol class="detail-steps">${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        </section>
      </div>`;
  $("#recipe-dialog").showModal();
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-page]");
  if (nav) {
    event.preventDefault();
    setPage(nav.dataset.page, { moveFocus: true });
  }
  const go = event.target.closest("[data-go]");
  if (go) setPage(go.dataset.go, { moveFocus: true });
  const slide = event.target.closest("[data-slide]");
  if (slide) selectHeroSlide(Number(slide.dataset.slide), { userInitiated: true });
  if (event.target.closest('[data-action="add-ingredient"]')) {
    setPage("inventory");
    openAddDialog();
  }
  const addToStorage = event.target.closest("[data-add-storage]");
  if (addToStorage) openAddDialog(addToStorage.dataset.addStorage);
  const recipeCard = event.target.closest("[data-recipe]");
  if (recipeCard) openRecipe(recipeCard.dataset.recipe);
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    openEditDialog(edit.dataset.edit);
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) confirmRemove(remove);
  if (event.target.closest(".close-detail")) $("#recipe-dialog").close();
  if (event.target.closest('[data-action="toggle-hidden-recipes"]')) {
    state.showHiddenRecipes = !state.showHiddenRecipes;
    renderRecipes();
    // The notice is re-drawn, so put focus back on the (relabelled) button.
    $('[data-action="toggle-hidden-recipes"]')?.focus();
  }
});
$("#featured-track").addEventListener("scroll", updateHeroDots, {
  passive: true,
});
$("#featured-previous").addEventListener("click", () => {
  selectHeroSlide((state.heroSlide - 1 + HERO_SLIDE_COUNT) % HERO_SLIDE_COUNT, { userInitiated: true });
});
$("#featured-next").addEventListener("click", () => {
  selectHeroSlide((state.heroSlide + 1) % HERO_SLIDE_COUNT, { userInitiated: true });
});
startHeroAutoplay();
// Cards that act as links or buttons (role="link"/"button" with tabindex)
// aren't native controls, so give them the same keys: Enter for both, and
// Space for buttons. They then run through the click handler above.
// Checkboxes only toggle on Space by default. Our dark-mode switch and the
// diet/allergy options look like buttons, so let Enter toggle them as well.
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    event.target.matches('.switch input[type="checkbox"], .chip input[type="checkbox"]')
  ) {
    event.preventDefault();
    event.target.click(); // toggles it and fires the usual change event
  }
});
document.addEventListener("keydown", (event) => {
  const control = event.target.closest('[tabindex="0"][role="button"], [tabindex="0"][role="link"]');
  if (!control || control !== event.target) return;
  const isButton = control.getAttribute("role") === "button";
  if (event.key === "Enter" || (isButton && event.key === " ")) {
    event.preventDefault();
    control.click();
  }
});
// Arrow keys move between the carousel dots.
$("#featured-dots").addEventListener("keydown", (event) => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step || !event.target.matches(".carousel-dot")) return;
  event.preventDefault();
  selectHeroSlide(state.heroSlide + step, { userInitiated: true });
  document.querySelectorAll(".carousel-dot")[state.heroSlide]?.focus();
});
$("#inventory-search").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderInventory();
});
$("#inventory-sort").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderInventory();
});

// --- Mobile swipe-to-reveal -------------------------------------------
// Narrow screens hide a row's edit/delete icons (app.css, 760px) and reveal
// them on a left swipe instead, like Gmail/Mail. A mouse never fires touch
// events, so this never engages on desktop even though the listeners are
// always attached.
const SWIPE_REVEAL = 112; // matches the two 56px buttons in .storage-row-swipe-actions
let swipeRow = null;
let swipeContent = null;
let swipeStartX = 0;
let swipeStartY = 0;
let swipeStartOffset = 0;
let swipeOffset = 0;
let swipeDeciding = true;
let swipeIsHorizontal = false;
let openSwipeRow = null;

function setSwipeOffset(content, offset, { animate = false } = {}) {
  content.style.transition = animate ? "transform 0.18s ease" : "";
  content.style.transform = offset ? `translateX(${offset}px)` : "";
}
function closeOpenSwipeRow() {
  if (!openSwipeRow) return;
  setSwipeOffset(openSwipeRow.querySelector(".storage-row-content"), 0, {
    animate: true,
  });
  openSwipeRow = null;
}

const inventoryGrid = $("#inventory-grid");
inventoryGrid.addEventListener(
  "touchstart",
  (event) => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const row = event.target.closest(".storage-row");
    if (!row) return;
    swipeRow = row;
    swipeContent = row.querySelector(".storage-row-content");
    swipeStartX = event.touches[0].clientX;
    swipeStartY = event.touches[0].clientY;
    swipeStartOffset = row === openSwipeRow ? -SWIPE_REVEAL : 0;
    swipeOffset = swipeStartOffset;
    swipeDeciding = true;
    swipeIsHorizontal = false;
  },
  { passive: true },
);
inventoryGrid.addEventListener(
  "touchmove",
  (event) => {
    if (!swipeRow) return;
    const touch = event.touches[0];
    const dx = touch.clientX - swipeStartX;
    const dy = touch.clientY - swipeStartY;
    if (swipeDeciding) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      swipeIsHorizontal = Math.abs(dx) > Math.abs(dy);
      swipeDeciding = false;
      if (!swipeIsHorizontal) {
        swipeRow = null;
        return;
      }
      if (openSwipeRow && openSwipeRow !== swipeRow) closeOpenSwipeRow();
    }
    event.preventDefault();
    swipeOffset = Math.max(-SWIPE_REVEAL, Math.min(0, swipeStartOffset + dx));
    setSwipeOffset(swipeContent, swipeOffset);
  },
  { passive: false },
);
inventoryGrid.addEventListener("touchend", () => {
  if (!swipeRow || !swipeIsHorizontal) {
    swipeRow = null;
    return;
  }
  const open = swipeOffset < -SWIPE_REVEAL / 2;
  setSwipeOffset(swipeContent, open ? -SWIPE_REVEAL : 0, { animate: true });
  openSwipeRow = open ? swipeRow : null;
  swipeRow = null;
});
// Tapping away from an open swipe row closes it first, the same way Mail
// and Gmail swallow the first tap outside an open row.
document.addEventListener(
  "click",
  (event) => {
    if (openSwipeRow && !openSwipeRow.contains(event.target)) {
      closeOpenSwipeRow();
      event.stopPropagation();
      event.preventDefault();
    }
  },
  true,
);

$("#recipe-search").addEventListener("input", renderRecipes);
$("#global-search").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const query = normalized(event.currentTarget.value);
  if (!query) return;
  if (
    state.recipes.some((recipe) =>
      normalized(`${recipe.name} ${recipe.ingredients.join(" ")}`).includes(
        query,
      ),
    )
  ) {
    $("#recipe-search").value = event.currentTarget.value;
    setPage("recipes");
  } else {
    $("#inventory-search").value = event.currentTarget.value;
    state.search = event.currentTarget.value;
    setPage("inventory");
  }
});
$("#refresh-recipes").addEventListener("click", () => {
  renderRecipes();
  showToast("Ideas refreshed from your pantry.");
});
$("#open-add").addEventListener("click", () => openAddDialog());
$("#close-dialog").addEventListener("click", () =>
  $("#ingredient-dialog").close(),
);
$("#cancel-dialog").addEventListener("click", () =>
  $("#ingredient-dialog").close(),
);
$("#ingredient-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name")).trim();
  if (!name) {
    $("#form-error").textContent = "Enter an ingredient name.";
    return;
  }
  const expiryDate = String(form.get("expiryDate") || "").trim() || null;
  if (expiryDate && !isISODate(expiryDate)) {
    $("#form-error").textContent = "Enter a valid expiry date.";
    return;
  }

if(editingItemId) {
  const item = state.inventory.find((item) => item.id === editingItemId);
  item.name = name;
  item.category = $("#food-category").value;
  item.storage = form.get("storage");
  item.quantity = Number(form.get("quantity"));
  item.calories = optionalNumber(form.get("calories"));
  item.servingSize = optionalNumber(form.get("servingSize"));
  item.expiryDate = expiryDate;

  editingItemId = null;
  saveInventory();
  $("#ingredient-dialog").close();
  event.currentTarget.reset();
  render();
  showToast(`${name} updated.`);
  return;
}

  const existing = state.inventory.find(
    (item) => normalized(item.name) === normalized(name),
  );
  if (existing) {
    existing.quantity =
      Number(existing.quantity) + Number(form.get("quantity"));
    // Mixed batches: track the one that goes off first.
    if (expiryDate && compareExpiry(expiryDate, existing.expiryDate) < 0)
      existing.expiryDate = expiryDate;
  } else
    state.inventory.push({
      id: `food-${Date.now()}`,
      name,
      category: $("#food-category").value,
      storage: form.get("storage"),
      quantity: Number(form.get("quantity")),
      calories: optionalNumber(form.get("calories")),
      servingSize: optionalNumber(form.get("servingSize")),
      unit: "qty",
      expiryDate,
    });
  saveInventory();
  const addedId =
    existing?.id || state.inventory[state.inventory.length - 1].id;
  $("#ingredient-dialog").close();
  event.currentTarget.reset();
  $("#inventory-search").value = "";
  state.search = "";
  setPage("inventory");
  const addedRow = [...document.querySelectorAll("[data-food-id]")].find(
    (row) => row.dataset.foodId === addedId,
  );
  addedRow?.scrollIntoView({ block: "center", behavior: "smooth" });
  addedRow?.classList.add("just-added");
  if (addedRow) setTimeout(() => addedRow.classList.remove("just-added"), 2200);
  showToast(
    existing ? `${name} quantity updated.` : `${name} added to your pantry.`,
  );
});
$("#export-json").addEventListener("click", () => {
  const blob = new Blob([`${JSON.stringify(state.inventory, null, 2)}\n`], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pantry-inventory.json";
  link.click();
  URL.revokeObjectURL(link.href);
});
$("#import-json").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (
      !Array.isArray(imported) ||
      imported.some(
        (item) =>
          !item.name ||
          !Number.isFinite(Number(item.quantity)) ||
          !Number.isFinite(Number(item.calories)) ||
          !Number.isFinite(Number(item.servingSize)),
      )
    )
      throw new Error(
        "Expected a JSON array with name, quantity, calories and servingSize fields.",
      );
    state.inventory = imported.map((item, index) => ({
      id: String(item.id || `import-${Date.now()}-${index}`),
      name: String(item.name).trim(),
      category: inventoryCategory(item),
      storage: storageLocation(item),
      quantity: Number(item.quantity),
      calories: Number(item.calories),
      servingSize: Number(item.servingSize),
      unit: String(item.unit || "qty"),
      expiryDate: isISODate(item.expiryDate) ? item.expiryDate : null,
    }));
    saveInventory();
    $("#inventory-search").value = "";
    state.search = "";
    setPage("inventory");
    showToast(`${state.inventory.length} ingredients imported.`);
  } catch (error) {
    showToast(`Import failed: ${error.message}`);
  }
  event.target.value = "";
});
$("#food-suggestions").innerHTML = [
  "Avocado",
  "Baby spinach",
  "Eggs",
  "Feta cheese",
  "Greek yogurt",
  "Lemon",
  "Pasta",
  "Tomatoes",
  "Onion",
  "Rice",
  "Chicken",
  "Garlic",
  "Bread",
]
  .map((name) => `<option value="${name}"></option>`)
  .join("");
$("#food-name").addEventListener("input", (event) => {
  $("#food-category").value = inventoryCategory(event.target.value);
  $("#food-storage").value = storageLocation(event.target.value);
  // Prefill a calorie/serving-size guess for a recognized name, but only
  // into fields the user hasn't already touched themselves.
  const guess = guessNutrition(event.target.value);
  if (guess) {
    const caloriesField = $('[name="calories"]');
    const servingField = $('[name="servingSize"]');
    if (!caloriesField.value) {
      caloriesField.value = guess.calories;
      caloriesField.classList.add("is-estimated");
    }
    if (!servingField.value) {
      servingField.value = guess.servingSize;
      servingField.classList.add("is-estimated");
    }
  }
});
// Once the user types into an auto-filled field themselves, it's their
// number now, not a guess — drop the "estimated" styling.
["calories", "servingSize"].forEach((field) => {
  $(`[name="${field}"]`).addEventListener("input", (event) => {
    event.target.classList.remove("is-estimated");
  });
});
// The native number-input spinner is too small to tap reliably, so the
// quantity field gets its own +/- buttons instead.
document.querySelectorAll(".qty-step").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.parentElement.querySelector('[name="quantity"]');
    const min = Number(input.min) || 0.1;
    const next = Math.max(min, Number(input.value || 0) + Number(button.dataset.step));
    input.value = Math.round(next * 10) / 10;
  });
});
// --- Dark mode -------------------------------------------------------------
// The inline script in index.html sets data-theme on load; this keeps the
// settings switch in sync and saves the user's choice.
const themeKey = "cookitup-theme";
const darkModeToggle = $("#dark-mode-toggle");
const sidebarThemeToggle = $("#sidebar-theme-toggle");

function applyTheme(theme, { animate = false } = {}) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transition");
    setTimeout(() => root.classList.remove("theme-transition"), 300);
  }
  root.dataset.theme = theme;
  darkModeToggle.checked = theme === "dark";
  sidebarThemeToggle.classList.toggle("is-dark", theme === "dark");
  const nextThemeLabel = theme === "dark" ? "Turn on light mode" : "Turn on dark mode";
  sidebarThemeToggle.setAttribute("aria-label", nextThemeLabel);
  sidebarThemeToggle.title = nextThemeLabel;
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  $('meta[name="theme-color"]').setAttribute("content", bg);
}

function savedTheme() {
  try {
    return localStorage.getItem(themeKey);
  } catch {
    return null;
  }
}

applyTheme(savedTheme() === "dark" ? "dark" : "light");

darkModeToggle.addEventListener("change", () => {
  setTheme(darkModeToggle.checked ? "dark" : "light");
});

function setTheme(theme) {
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    // Storage can be blocked (private mode); the theme still applies for now.
  }
  applyTheme(theme, { animate: true });
}

sidebarThemeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

buildPreferenceOptions();
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  focusPageHeading();
});
$("#preferences-page").addEventListener("change", (event) => {
  const input = event.target.closest("[data-pref-kind]");
  if (!input) return;
  const list = state.prefs[input.dataset.prefKind];
  state.prefs[input.dataset.prefKind] = input.checked
    ? [...list, input.value]
    : list.filter((id) => id !== input.value);
  savePreferences();
  render();
});
$("#clear-preferences").addEventListener("click", () => {
  state.prefs = emptyPreferences();
  savePreferences();
  render();
  $("[data-pref-kind]").focus(); // the button is now disabled
  showToast("Preferences cleared.");
});

const initialPage = location.hash.slice(1);
loadData().then(() => {
  if (["dashboard", "inventory", "recipes", "settings", "preferences"].includes(
      initialPage,
    ))
    setPage(initialPage);
});


