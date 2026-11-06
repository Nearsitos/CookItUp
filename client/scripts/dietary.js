// client/scripts/dietary.js
// Dietary preferences: the diet and allergy options a user can pick, and the
// logic that checks a recipe against them. Loaded before app.js.
//
// How it works: every ingredient gets a set of "tags" (dairy, gluten, meat…).
// Allergies map straight onto tags; each diet lists the tags it rules out.
// Known starter ingredients are listed explicitly; anything else (ingredients
// users type in) falls back to keyword matching on the name.

const DIETS = [
  {
    id: "vegetarian",
    label: "Vegetarian",
    hint: "No meat or fish",
    excludes: ["meat", "fish", "shellfish"],
  },
  {
    id: "vegan",
    label: "Vegan",
    hint: "No animal products",
    excludes: ["meat", "fish", "shellfish", "dairy", "eggs", "honey"],
  },
  {
    id: "pescatarian",
    label: "Pescatarian",
    hint: "Fish, but no meat",
    excludes: ["meat"],
  },
  {
    id: "gluten-free",
    label: "Gluten-free",
    hint: "No wheat, barley or rye",
    excludes: ["gluten"],
  },
  {
    id: "dairy-free",
    label: "Dairy-free",
    hint: "No milk, cheese or yogurt",
    excludes: ["dairy"],
  },
];

const ALLERGENS = [
  { id: "peanuts", label: "Peanuts" },
  { id: "tree-nuts", label: "Tree nuts" },
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "gluten", label: "Gluten / wheat" },
  { id: "soy", label: "Soy" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
  { id: "sesame", label: "Sesame" },
];

// Explicit tags for the ingredients CookItUp ships with.
const INGREDIENT_TAGS = {
  avocado: [],
  "baby spinach": [],
  bread: ["gluten"],
  chicken: ["meat"],
  eggs: ["eggs"],
  "feta cheese": ["dairy"],
  garlic: [],
  "greek yogurt": ["dairy"],
  lemon: [],
  onion: [],
  pasta: ["gluten"],
  rice: [],
  tomatoes: [],
};

// Fallback for anything not listed above. Word boundaries keep "eggplant"
// from counting as eggs.
const TAG_KEYWORDS = {
  dairy: /\b(milk|cheese|feta|parmesan|mozzarella|cheddar|yogh?urt|butter|cream|ghee)\b/,
  eggs: /\beggs?\b|mayonnaise|\bmayo\b/,
  gluten: /\bsoy sauce\b|\b(wheat|flour|bread|pasta|spaghetti|noodles?|couscous|barley|rye|tortillas?|crackers?|breadcrumbs?|seitan)\b/,
  meat: /\b(chicken|beef|pork|bacon|ham|turkey|lamb|sausages?|steak|salami|chorizo|prosciutto|duck|veal)\b/,
  fish: /\b(fish|salmon|tuna|cod|tilapia|trout|sardines?|anchov(y|ies)|halibut|mackerel)\b/,
  shellfish: /\b(shrimp|prawns?|crab|lobster|clams?|mussels?|oysters?|scallops?)\b/,
  peanuts: /\bpeanuts?\b/,
  "tree-nuts": /\b(almonds?|cashews?|walnuts?|pecans?|pistachios?|hazelnuts?|macadamias?)\b/,
  soy: /\b(soy|soya|tofu|tempeh|edamame|miso)\b/,
  sesame: /\b(sesame|tahini)\b/,
  honey: /\bhoney\b/,
};

// Plant-based look-alikes that would otherwise trip the dairy keywords.
const NOT_DAIRY = /\b(almond|oat|soy|coconut|rice|cashew) (milk|yogh?urt|cream)\b|\b(peanut|almond|cashew|cocoa|apple) butter\b/;

function ingredientTags(name) {
  const key = String(name || "").trim().toLowerCase();
  if (key in INGREDIENT_TAGS) return new Set(INGREDIENT_TAGS[key]);
  const tags = new Set();
  for (const [tag, pattern] of Object.entries(TAG_KEYWORDS)) {
    if (pattern.test(key)) tags.add(tag);
  }
  if (NOT_DAIRY.test(key)) tags.delete("dairy");
  return tags;
}

function emptyPreferences() {
  return { diets: [], allergies: [] };
}

// Checks one recipe against the user's preferences.
// Returns which allergens it contains, which diets it breaks, and, per
// ingredient, what the problem is (for the notes in the recipe dialog).
function checkRecipe(recipe, prefs) {
  const allergens = new Set();
  const dietConflicts = new Set();
  const ingredientNotes = new Map(); // ingredient -> { allergens, diets }

  for (const ingredient of recipe.ingredients) {
    const tags = ingredientTags(ingredient);
    const note = {
      allergens: prefs.allergies.filter((allergy) => tags.has(allergy)),
      diets: prefs.diets.filter((dietId) =>
        DIETS.find((item) => item.id === dietId)?.excludes.some((tag) =>
          tags.has(tag),
        ),
      ),
    };
    note.allergens.forEach((id) => allergens.add(id));
    note.diets.forEach((id) => dietConflicts.add(id));
    if (note.allergens.length || note.diets.length)
      ingredientNotes.set(ingredient, note);
  }

  return {
    allergens: [...allergens],
    dietConflicts: [...dietConflicts],
    ingredientNotes,
    // Contains an allergen (red tags).
    hidden: allergens.size > 0,
    // Allergen-safe, but breaks a chosen diet (amber tags).
    flagged: allergens.size === 0 && dietConflicts.size > 0,
    // Fits every preference; only these show by default on Recipe ideas.
    fits: allergens.size === 0 && dietConflicts.size === 0,
  };
}

function allergenLabel(id) {
  return ALLERGENS.find((item) => item.id === id)?.label.split(" /")[0] || id;
}
function dietLabel(id) {
  return DIETS.find((item) => item.id === id)?.label || id;
}
