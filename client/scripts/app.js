const foodEmojis = {
  avocado: "◉",
  "baby spinach": "❧",
  eggs: "◯",
  "feta cheese": "▧",
  "greek yogurt": "◌",
  lemon: "◉",
  pasta: "≋",
  tomatoes: "◎",
  onion: "◎",
  rice: "⁙",
  chicken: "◈",
  garlic: "✣",
  bread: "▱",
  default: "◇",
};
const $ = (selector) => document.querySelector(selector);
const state = {
  inventory: [],
  recipes: [],
  page: "dashboard",
  search: "",
  sort: "name",
  heroSlide: 1,
  prefs: emptyPreferences(),
  showHiddenRecipes: false,
};
const storageKey = "cookitup-mvp-inventory";
const preferencesKey = "cookitup-preferences";
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
            <div class="featured-meta"><span>◷ &nbsp;${suggested.recipe.time} mins</span><span>♧ &nbsp;2 portions</span><span>♨ &nbsp;480 kcal</span></div>
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
        `<button type="button" class="carousel-dot${index === state.heroSlide ? " selected" : ""}" data-slide="${index}" aria-label="Show highlight ${index + 1}" aria-current="${index === state.heroSlide ? "true" : "false"}"></button>`,
    )
    .join("");
  track.scrollLeft = track.clientWidth * state.heroSlide;
  syncHeroControls();
}
function selectHeroSlide(index) {
  const track = $("#featured-track");
  if (!track) return;
  state.heroSlide = Math.max(0, Math.min(2, index));
  heroScrollTarget = state.heroSlide;
  track.scrollTo({
    left: track.clientWidth * state.heroSlide,
    behavior: "smooth",
  });
  syncHeroControls();
}
// While a dot-triggered smooth scroll is running, ignore the in-between
// scroll positions so the selection doesn't flicker back.
let heroScrollTarget = null;
function updateHeroDots() {
  const track = $("#featured-track");
  if (track?.clientWidth) {
    const visible = Math.round(track.scrollLeft / track.clientWidth);
    if (heroScrollTarget !== null && visible !== heroScrollTarget) return;
    heroScrollTarget = null;
    state.heroSlide = visible;
  }
  syncHeroControls();
}
function syncHeroControls() {
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
}
function renderInventory() {
  const search = normalized(state.search);
  const items = state.inventory
    .filter((item) => normalized(item.name).includes(search))
    .sort((a, b) =>
      state.sort === "calories"
        ? Number(a.calories) - Number(b.calories)
        : state.sort === "name-desc"
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name),
    );
  $("#inventory-body").innerHTML = items
    .map(
      (item) =>
        `<tr data-food-id="${escapeHtml(item.id)}"><td><span class="table-food"><span class="food-emoji">${emojiFor(item.name)}</span>${escapeHtml(item.name)}</span></td><td>${formatNumber(item.quantity)} ${escapeHtml(item.unit || "qty")}</td><td>${formatNumber(item.calories)} kcal</td><td>${formatNumber(item.servingSize)} g</td><td><button class="delete-item" data-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">×</button></td></tr>`,
    )
    .join("");
  $("#inventory-empty").classList.toggle("hidden", items.length > 0);
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
// moveFocus: when the user navigates, put focus on the new page's heading so
// keyboard and screen-reader users start at the top of the content.
function setPage(page, { moveFocus = false } = {}) {
  state.page = page;
  document
    .querySelectorAll(".page")
    .forEach((section) =>
      section.classList.toggle("hidden", section.id !== `${page}-page`),
    );
  document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
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
function openAddDialog() {
  $("#form-error").textContent = "";
  $("#ingredient-dialog").showModal();
  $("#food-name").focus();
}
function openRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  const { hits, missing } = recipeMatch(recipe);
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
  $("#recipe-detail").innerHTML =
    `<button class="icon-button close-detail" aria-label="Close">×</button><div class="detail-photo" style="background-image:url('${recipe.image || "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85"}')" role="img" aria-label="${escapeHtml(recipe.name)}"></div><p class="eyebrow">${escapeHtml(recipe.category)} · ${recipe.time} MINUTES</p><h2>${escapeHtml(recipe.name)}</h2><p>${escapeHtml(recipe.description)}</p>${dietWarning}<p class="match-caption">You have ${hits.length} of ${recipe.ingredients.length} ingredients${missing ? ` · ${missing} still to get` : " · ready to cook"}.</p><h3>Ingredients</h3><ul class="detail-ingredients">${recipe.ingredients.map((ingredient) => `<li>${ingredientLine(ingredient)}</li>`).join("")}</ul><h3>Method</h3><ol class="detail-steps">${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`;
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
  if (slide) selectHeroSlide(Number(slide.dataset.slide));
  if (event.target.closest('[data-action="add-ingredient"]')) {
    setPage("inventory");
    openAddDialog();
  }
  const recipeCard = event.target.closest("[data-recipe]");
  if (recipeCard) openRecipe(recipeCard.dataset.recipe);
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    // Remember the row position so focus can move to the next row's button
    // instead of being lost when this row disappears.
    const buttons = [...document.querySelectorAll("[data-remove]")];
    const index = buttons.indexOf(remove);
    state.inventory = state.inventory.filter(
      (item) => item.id !== remove.dataset.remove,
    );
    saveInventory();
    render();
    const remaining = document.querySelectorAll("[data-remove]");
    (remaining[Math.min(index, remaining.length - 1)] || $("#inventory-search")).focus();
    showToast("Ingredient removed from your pantry.");
  }
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
  selectHeroSlide(state.heroSlide + step);
  document.querySelectorAll(".carousel-dot")[state.heroSlide]?.focus();
});
const menuButton = $(".menu-button");
function setMobileNavigationExpanded(expanded) {
  document.body.classList.toggle("sidebar-expanded", expanded);
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute(
    "aria-label",
    `${expanded ? "Collapse" : "Expand"} navigation`,
  );
}
menuButton.addEventListener("click", () => {
  setMobileNavigationExpanded(
    !document.body.classList.contains("sidebar-expanded"),
  );
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    document.body.classList.contains("sidebar-expanded")
  ) {
    setMobileNavigationExpanded(false);
    menuButton.focus();
  }
});
document
  .querySelector("#primary-navigation")
  .addEventListener("click", (event) => {
    if (
      event.target.closest("[data-page]") &&
      window.matchMedia("(max-width: 760px)").matches
    ) {
      setMobileNavigationExpanded(false);
    }
  });
$("#inventory-search").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderInventory();
});
$("#inventory-sort").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderInventory();
});
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
$("#open-add").addEventListener("click", openAddDialog);
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
  const existing = state.inventory.find(
    (item) => normalized(item.name) === normalized(name),
  );
  if (existing)
    existing.quantity =
      Number(existing.quantity) + Number(form.get("quantity"));
  else
    state.inventory.push({
      id: `food-${Date.now()}`,
      name,
      quantity: Number(form.get("quantity")),
      calories: Number(form.get("calories")),
      servingSize: Number(form.get("servingSize")),
      unit: "qty",
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
      quantity: Number(item.quantity),
      calories: Number(item.calories),
      servingSize: Number(item.servingSize),
      unit: String(item.unit || "qty"),
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
// --- Dark mode -------------------------------------------------------------
// The inline script in index.html sets data-theme on load; this keeps the
// settings switch in sync and saves the user's choice.
const themeKey = "cookitup-theme";
const darkModeToggle = $("#dark-mode-toggle");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme, { animate = false } = {}) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transition");
    setTimeout(() => root.classList.remove("theme-transition"), 300);
  }
  root.dataset.theme = theme;
  darkModeToggle.checked = theme === "dark";
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

applyTheme(document.documentElement.dataset.theme || "light");

darkModeToggle.addEventListener("change", () => {
  const theme = darkModeToggle.checked ? "dark" : "light";
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    // Storage can be blocked (private mode); the theme still applies for now.
  }
  applyTheme(theme, { animate: true });
});

// Follow the operating system until the user picks a theme themselves.
systemDark.addEventListener("change", (event) => {
  if (!savedTheme()) applyTheme(event.matches ? "dark" : "light", { animate: true });
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


