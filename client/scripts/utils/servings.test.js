import { describe, it, expect } from "vitest";
import { scaleQuantity, formatAmount } from "./servings.js";

describe("scaleQuantity", () => {
  it("scales down to one serving", () => {
    expect(scaleQuantity(600, 4, 1)).toBe(150);
  });

  it("scales up", () => {
    expect(scaleQuantity(200, 4, 6)).toBe(300);
  });

  it("returns null when there is no quantity", () => {
    expect(scaleQuantity(null, 4, 2)).toBeNull();
  });
});

describe("formatAmount", () => {
  it("shows grams and millilitres", () => {
    expect(formatAmount(150, "g")).toBe("150 g");
    expect(formatAmount(30, "ml")).toBe("30 ml");
  });

  it("keeps one decimal for small amounts", () => {
    expect(formatAmount(2.5, "g")).toBe("2.5 g");
    expect(formatAmount(3, "g")).toBe("3 g");
  });

  it("rounds larger amounts to whole numbers", () => {
    expect(formatAmount(152.4, "g")).toBe("152 g");
  });

  it("switches to kg and L from 1000", () => {
    expect(formatAmount(1500, "g")).toBe("1.5 kg");
    expect(formatAmount(1000, "ml")).toBe("1 L");
  });

  it("uses a pinch or dash for tiny amounts", () => {
    expect(formatAmount(0.125, "g")).toBe("a pinch");
    expect(formatAmount(0.5, "ml")).toBe("a dash");
  });

  it("shows counts as whole numbers and quarters", () => {
    expect(formatAmount(2, null)).toBe("2");
    expect(formatAmount(1.5, null)).toBe("1½");
    expect(formatAmount(0.25, null)).toBe("¼");
    expect(formatAmount(0.1, null)).toBe("¼");
  });

  it("returns an empty string with no quantity", () => {
    expect(formatAmount(null, "g")).toBe("");
  });
});
