// client/scripts/utils/servings.js
// Helpers for the recipe servings control: scale an ingredient amount to a
// different number of servings, and format it the way a cook would read it.

/** Scales a quantity made for `baseServings` to `targetServings`. */
export function scaleQuantity(quantity, baseServings, targetServings) {
  if (quantity == null || !baseServings) return null;
  return (quantity * targetServings) / baseServings;
}

// Drops a trailing ".0" so 2.0 shows as "2".
function trimNumber(value, decimals) {
  return String(Number(value.toFixed(decimals)));
}

const FRACTIONS = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

// Counts (2 onions, 1.5 lemons) read best as whole numbers and quarters.
function formatCount(quantity) {
  const quarters = Math.max(1, Math.round(quantity * 4)); // never show "0 onions"
  const whole = Math.floor(quarters / 4);
  const fraction = FRACTIONS[(quarters % 4) / 4] || "";
  return whole ? `${whole}${fraction}` : fraction;
}

// Grams and millilitres: precise when small, rounded when large,
// switching to kg / L from 1000 up.
function formatMetric(quantity, unit) {
  const big = unit === "g" ? "kg" : "L";
  if (quantity < 1) return unit === "g" ? "a pinch" : "a dash";
  if (quantity < 10) return `${trimNumber(quantity, 1)} ${unit}`;
  if (quantity < 1000) return `${Math.round(quantity)} ${unit}`;
  return `${trimNumber(quantity / 1000, 2)} ${big}`;
}

/**
 * Formats an amount for display, e.g. (150, "g") -> "150 g",
 * (0.125, "g") -> "a pinch", (1.5, null) -> "1½". Returns "" when there is
 * no quantity ("salt, to taste").
 */
export function formatAmount(quantity, unit) {
  if (quantity == null || Number.isNaN(quantity)) return "";
  if (unit === "g" || unit === "ml") return formatMetric(quantity, unit);
  const count = formatCount(quantity);
  return unit ? `${count} ${unit}` : count;
}
