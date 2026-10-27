import { describe, expect, it } from "vitest";
import { formatScore360, score360Tone } from "../score-360-display";

describe("Score 360° display rules", () => {
  it("uses red from 0 to 4.9", () => {
    expect(score360Tone(0)).toBe("danger");
    expect(score360Tone(4.9)).toBe("danger");
  });
  it("uses amber from 5 to 6.9", () => {
    expect(score360Tone(5)).toBe("warning");
    expect(score360Tone(6.9)).toBe("warning");
  });
  it("uses green from 7 to 10", () => {
    expect(score360Tone(7)).toBe("success");
    expect(score360Tone(10)).toBe("success");
  });
  it("does not substitute a missing score with zero", () => {
    expect(score360Tone(null)).toBe("missing");
    expect(score360Tone(undefined)).toBe("missing");
    expect(formatScore360(null)).toBe("Sin score");
    expect(formatScore360(0)).toBe("0.0/10");
  });
  it("formats the existing detail score on a ten-point scale with one decimal", () => {
    expect(formatScore360(6)).toBe("6.0/10");
    expect(formatScore360(9.3)).toBe("9.3/10");
  });
});