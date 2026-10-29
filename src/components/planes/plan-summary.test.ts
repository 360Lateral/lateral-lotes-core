import { describe, expect, it } from "vitest";
import { resumirInclusiones } from "./plan-summary";

describe("resumen móvil de inclusiones", () => {
  it("cuenta los análisis incluidos, no los excluidos", () => {
    expect(resumirInclusiones([true, true, false, false, false, false, false, false, false, false]).total).toBe(2);
  });
  it("solo destaca inclusiones nuevas frente al plan anterior", () => {
    expect(resumirInclusiones([true, true, true, true, true], [true, true, false, false, false]).nuevas).toEqual([2, 3, 4]);
  });
  it("limita los destacados a tres sin alterar el total", () => {
    expect(resumirInclusiones([true, true, true, true])).toEqual({ total: 4, nuevas: [0, 1, 2] });
  });
  it("no inventa un tercer destacado cuando solo hay dos novedades", () => {
    expect(resumirInclusiones([true, true, true, true], [true, true])).toEqual({ total: 4, nuevas: [2, 3] });
  });
});