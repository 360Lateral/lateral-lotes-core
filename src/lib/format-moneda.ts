/**
 * @fileoverview Helpers de formato de moneda y números para 360Lateral.
 *
 * CONVENCIÓN DEL PROYECTO:
 * ========================
 * NUNCA usar Intl.NumberFormat, .toLocaleString() ni template strings con $
 * directamente en componentes para formatear moneda o números.
 *
 * SIEMPRE usar los helpers de este archivo:
 *   - formatCOP(n)            → "$1.250.000"
 *   - formatCOPCompact(n)     → "$1,5 M"
 *   - formatNumero(n)         → "1.250.000"
 *   - formatMetros(n)         → "2.826 m²"
 *   - formatPorcentaje(n)     → "15,5%"
 *   - formatNumeroCompact(n)  → "1,5 M"
 *   - formatUSD(n)            → "USD $250.000"
 *
 * Razones:
 *   1. Consistencia visual entre vistas.
 *   2. Defensa contra entornos donde el locale "es-CO" no esté disponible
 *      (algunos navegadores móviles, SSR, etc.).
 *   3. Migración fácil si se cambia el formato regional.
 *   4. Testeable como función pura.
 */

// =====================================================
// FALLBACK MANUAL (si Intl falla por locale no disponible)
// =====================================================

const formatCOPManual = (n: number, decimales: number = 0): string => {
  const negativo = n < 0;
  const absoluto = Math.abs(n);
  const partes = absoluto.toFixed(decimales).split(".");
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formateado = partes.length > 1 ? partes.join(",") : partes[0];
  return `${negativo ? "-" : ""}$${formateado}`;
};

const formatNumeroManual = (n: number, decimales: number = 0): string => {
  const negativo = n < 0;
  const absoluto = Math.abs(n);
  const partes = absoluto.toFixed(decimales).split(".");
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formateado = partes.length > 1 ? partes.join(",") : partes[0];
  return `${negativo ? "-" : ""}${formateado}`;
};

// =====================================================
// DETECTOR DE LOCALE DISPONIBLE
// =====================================================

let localeDisponible: boolean | null = null;

const esCOLocaleDisponible = (): boolean => {
  if (localeDisponible !== null) return localeDisponible;
  try {
    const test = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(1000);
    localeDisponible = test.includes(".");
    return localeDisponible;
  } catch {
    localeDisponible = false;
    return false;
  }
};

// =====================================================
// HELPER INTERNO
// =====================================================

const formatDecimal = (n: number, decimales: number): string => {
  return n.toFixed(decimales).replace(".", ",");
};

// =====================================================
// HELPERS PÚBLICOS
// =====================================================

/**
 * Formato moneda COP estándar.
 * @example formatCOP(1250000) → "$1.250.000"
 * @example formatCOP(null) → "—"
 */
export const formatCOP = (n: number | null | undefined): string => {
  if (n == null || isNaN(n as number)) return "—";
  if (esCOLocaleDisponible()) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n as number);
  }
  return formatCOPManual(n as number, 0);
};

/**
 * Formato moneda COP compacto para cifras grandes.
 * @example formatCOPCompact(1500) → "$1,5 K"
 * @example formatCOPCompact(1500000) → "$1,5 M"
 * @example formatCOPCompact(1500000000) → "$1,5 MM"
 * @example formatCOPCompact(1500000000000) → "$1,5 B"
 */
export const formatCOPCompact = (n: number | null | undefined): string => {
  if (n == null || isNaN(n as number)) return "—";
  const absoluto = Math.abs(n as number);
  const signo = (n as number) < 0 ? "-" : "";

  if (absoluto >= 1_000_000_000_000) return `${signo}$${formatDecimal(absoluto / 1_000_000_000_000, 2)} B`;
  if (absoluto >= 1_000_000_000) return `${signo}$${formatDecimal(absoluto / 1_000_000_000, 2)} MM`;
  if (absoluto >= 1_000_000) return `${signo}$${formatDecimal(absoluto / 1_000_000, 2)} M`;
  if (absoluto >= 1_000) return `${signo}$${formatDecimal(absoluto / 1_000, 1)} K`;
  return formatCOP(n);
};

/**
 * Formato número simple con separadores de miles.
 * @example formatNumero(1250000) → "1.250.000"
 */
export const formatNumero = (n: number | null | undefined, decimales: number = 0): string => {
  if (n == null || isNaN(n as number)) return "—";
  if (esCOLocaleDisponible()) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(n as number);
  }
  return formatNumeroManual(n as number, decimales);
};

/**
 * Formato para superficies en metros cuadrados.
 * @example formatMetros(2826) → "2.826 m²"
 */
export const formatMetros = (n: number | null | undefined, decimales: number = 0): string => {
  if (n == null || isNaN(n as number)) return "—";
  return `${formatNumero(n, decimales)} m²`;
};

/**
 * Formato porcentaje.
 * @example formatPorcentaje(15.5) → "15,5%"
 */
export const formatPorcentaje = (n: number | null | undefined, decimales: number = 1): string => {
  if (n == null || isNaN(n as number)) return "—";
  return `${formatNumero(n, decimales)}%`;
};

/**
 * Formato número compacto sin símbolo de moneda.
 * @example formatNumeroCompact(1500000) → "1,5 M"
 */
export const formatNumeroCompact = (n: number | null | undefined): string => {
  if (n == null || isNaN(n as number)) return "—";
  const absoluto = Math.abs(n as number);
  const signo = (n as number) < 0 ? "-" : "";

  if (absoluto >= 1_000_000_000_000) return `${signo}${formatDecimal(absoluto / 1_000_000_000_000, 2)} B`;
  if (absoluto >= 1_000_000_000) return `${signo}${formatDecimal(absoluto / 1_000_000_000, 2)} MM`;
  if (absoluto >= 1_000_000) return `${signo}${formatDecimal(absoluto / 1_000_000, 1)} M`;
  if (absoluto >= 1_000) return `${signo}${formatDecimal(absoluto / 1_000, 1)} K`;
  return formatNumero(n, 0);
};

/**
 * Formato USD para mostrar equivalente cuando aplica.
 * @example formatUSD(250000) → "USD $250,000"
 */
export const formatUSD = (n: number | null | undefined): string => {
  if (n == null || isNaN(n as number)) return "—";
  try {
    return `USD $${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n as number)}`;
  } catch {
    return `USD $${(n as number).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
};
