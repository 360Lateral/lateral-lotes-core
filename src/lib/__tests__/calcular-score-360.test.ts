import { describe, expect, it } from "vitest";
import { calcularScore360, SCORE_360_FIELDS } from "../calcular-score-360";

describe("Stored module Score 360", () => {
  it("returns null when no module has a score", () => {
    expect(calcularScore360(Object.fromEntries(SCORE_360_FIELDS.map((field) => [field, null])))).toBeNull();
  });
  it("averages only completed modules: Escobero is 4.0 with 3 of 8", () => {
    expect(calcularScore360({ score_juridico: 4, score_normativo: 4, score_servicios: 4, score_ambiental: null, score_arquitectonico: null, score_financiero: null, score_geotecnico: null, score_mercado: null })).toEqual({ promedio: 4, modulos: 3 });
  });
  it("rounds the average to one decimal", () => {
    expect(calcularScore360({ score_juridico: 5, score_normativo: 6, score_servicios: 8 })).toEqual({ promedio: 6.3, modulos: 3 });
  });
  it("counts zero as a completed score", () => {
    expect(calcularScore360({ score_juridico: 0, score_servicios: 8 })).toEqual({ promedio: 4, modulos: 2 });
  });
  it("includes all eight named modules", () => {
    expect(calcularScore360({ score_juridico: 1, score_normativo: 2, score_servicios: 3, score_ambiental: 4, score_arquitectonico: 5, score_financiero: 6, score_geotecnico: 7, score_mercado: 8 })).toEqual({ promedio: 4.5, modulos: 8 });
  });
});