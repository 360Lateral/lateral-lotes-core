import { describe, it, expect } from "vitest";
import {
  formatCOP,
  formatCOPCompact,
  formatNumero,
  formatMetros,
  formatPorcentaje,
  formatNumeroCompact,
  formatUSD,
} from "../format-moneda";

describe("format-moneda", () => {
  describe("formatCOP", () => {
    it("formatea valor positivo", () => {
      expect(formatCOP(1250000)).toMatch(/\$\s?1\.250\.000/);
    });
    it("formatea cero", () => {
      expect(formatCOP(0)).toMatch(/\$\s?0/);
    });
    it("retorna '—' para null", () => {
      expect(formatCOP(null)).toBe("—");
    });
    it("retorna '—' para undefined", () => {
      expect(formatCOP(undefined)).toBe("—");
    });
    it("retorna '—' para NaN", () => {
      expect(formatCOP(NaN)).toBe("—");
    });
  });

  describe("formatCOPCompact", () => {
    it("usa K para miles", () => {
      expect(formatCOPCompact(5500)).toBe("$5,5 K");
    });
    it("usa M para millones", () => {
      expect(formatCOPCompact(2500000)).toBe("$2,50 M");
    });
    it("usa MM para mil millones", () => {
      expect(formatCOPCompact(1500000000)).toBe("$1,50 MM");
    });
    it("usa B para billones", () => {
      expect(formatCOPCompact(2300000000000)).toBe("$2,30 B");
    });
    it("retorna '—' para null", () => {
      expect(formatCOPCompact(null)).toBe("—");
    });
  });

  describe("formatMetros", () => {
    it("formatea entero", () => {
      expect(formatMetros(2826)).toMatch(/2\.826 m²/);
    });
    it("formatea con decimales", () => {
      expect(formatMetros(2825.66, 2)).toMatch(/2\.825,66 m²/);
    });
  });

  describe("formatPorcentaje", () => {
    it("formatea 1 decimal por defecto", () => {
      expect(formatPorcentaje(15.5)).toBe("15,5%");
    });
    it("formatea con más decimales", () => {
      expect(formatPorcentaje(15.567, 2)).toBe("15,57%");
    });
  });

  describe("formatNumeroCompact", () => {
    it("usa M para millones", () => {
      expect(formatNumeroCompact(1500000)).toBe("1,5 M");
    });
    it("retorna número pequeño sin sufijo", () => {
      expect(formatNumeroCompact(84)).toMatch(/84/);
    });
  });

  describe("formatUSD", () => {
    it("formatea con prefijo USD", () => {
      expect(formatUSD(250000)).toMatch(/USD \$250,000/);
    });
  });
});
