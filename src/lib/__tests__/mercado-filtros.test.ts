import { describe, expect, it } from "vitest";
import { normalizarFiltrosMercado } from "../mercado-filtros";

describe("Market filters", () => {
  it("removes Barrio from restored filters while preserving all supported filters", () => {
    const restored = { barrio: "El Poblado", ciudad: "Medellín", categoria_area: ["pequeno"], rango_precio: ["rango_1"], uso_actual: "Residencial" };
    expect(normalizarFiltrosMercado(restored)).toEqual({ ciudad: "Medellín", categoria_area: ["pequeno"], rango_precio: ["rango_1"], uso_actual: "Residencial" });
    expect(normalizarFiltrosMercado({ barrio: "El Poblado" } as typeof restored)).toEqual({});
  });
});