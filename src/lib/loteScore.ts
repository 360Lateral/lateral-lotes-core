/**
 * Score de Publicabilidad — Enfoque mixto
 *
 * REQUISITOS OBLIGATORIOS (bloquean publicación si faltan):
 *  1. Tiene escritura pública
 *  2. Ubicación completa (departamento + ciudad)
 *  3. Área registrada (> 0 m²)
 *
 * SCORE BONUS (0-100, mejora visibilidad):
 *  - Fotos adjuntas (≥1)          → 20 pts
 *  - Precio definido               → 20 pts
 *  - Servicios públicos (≥1)       → 15 pts
 *  - Sin deudas ni gravámenes      → 15 pts
 *  - Sin problemas jurídicos       → 15 pts
 *  - Documentos adjuntos (≥1)      → 10 pts
 *  - Matrícula inmobiliaria        → 5 pts
 */

export interface LoteScoreInput {
  // Mandatory
  tiene_escritura: string; // "si" | "no" | ""
  departamento: string;
  ciudad: string;
  area_total_m2: string;
  // Bonus
  photosCount: number;
  precio_cop: string;
  serviciosCount: number;
  tiene_deudas: string;      // "si" | "no" | "no_se" | ""
  problema_juridico: string; // "si" | "no" | "no_se" | ""
  docsCount: number;
  matricula_inmobiliaria?: string;
}

export interface MandatoryCheck {
  key: string;
  label: string;
  passed: boolean;
  hint: string;
}

export interface BonusFactor {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  passed: boolean;
  hint: string;
}

export interface LoteScoreResult {
  mandatory: MandatoryCheck[];
  allMandatoryPassed: boolean;
  bonus: BonusFactor[];
  bonusScore: number;
  maxBonusScore: number;
  level: "alto" | "medio" | "bajo";
}

export function calculateLoteScore(input: LoteScoreInput): LoteScoreResult {
  // --- Mandatory ---
  const mandatory: MandatoryCheck[] = [
    {
      key: "escritura",
      label: "Escritura pública",
      passed: input.tiene_escritura === "si",
      hint: "Debes confirmar que el lote tiene escritura pública registrada.",
    },
    {
      key: "ubicacion",
      label: "Ubicación completa",
      passed: !!input.departamento.trim() && !!input.ciudad.trim(),
      hint: "Ingresa el departamento y municipio del lote.",
    },
    {
      key: "area",
      label: "Área registrada",
      passed: !!input.area_total_m2 && parseFloat(input.area_total_m2) > 0,
      hint: "El área del lote debe ser mayor a 0 m².",
    },
  ];

  const allMandatoryPassed = mandatory.every((m) => m.passed);

  // --- Bonus ---
  const bonus: BonusFactor[] = [
    {
      key: "fotos",
      label: "Fotos del lote",
      maxPoints: 20,
      points: input.photosCount >= 1 ? 20 : 0,
      passed: input.photosCount >= 1,
      hint: "Sube al menos una foto para dar visibilidad a tu lote.",
    },
    {
      key: "precio",
      label: "Precio definido",
      maxPoints: 20,
      points: !!input.precio_cop && parseInt(input.precio_cop) > 0 ? 20 : 0,
      passed: !!input.precio_cop && parseInt(input.precio_cop) > 0,
      hint: "Agrega un precio estimado o de referencia.",
    },
    {
      key: "servicios",
      label: "Servicios públicos",
      maxPoints: 15,
      points: input.serviciosCount >= 1 ? 15 : 0,
      passed: input.serviciosCount >= 1,
      hint: "Marca los servicios disponibles (agua, energía, gas, etc.).",
    },
    {
      key: "deudas",
      label: "Sin deudas ni gravámenes",
      maxPoints: 15,
      points: input.tiene_deudas === "no" ? 15 : 0,
      passed: input.tiene_deudas === "no",
      hint: "Confirma que el lote no tiene deudas ni gravámenes pendientes.",
    },
    {
      key: "juridico",
      label: "Sin problemas jurídicos",
      maxPoints: 15,
      points: input.problema_juridico === "no" ? 15 : 0,
      passed: input.problema_juridico === "no",
      hint: "Confirma que no hay problemas jurídicos asociados al lote.",
    },
    {
      key: "docs",
      label: "Documentos adjuntos",
      maxPoints: 10,
      points: input.docsCount >= 1 ? 10 : 0,
      passed: input.docsCount >= 1,
      hint: "Adjunta escritura, planos, certificados u otros documentos de soporte.",
    },
    {
      key: "matricula",
      label: "Matrícula inmobiliaria",
      maxPoints: 5,
      points: !!input.matricula_inmobiliaria?.trim() ? 5 : 0,
      passed: !!input.matricula_inmobiliaria?.trim(),
      hint: "Incluye el número de matrícula inmobiliaria del lote.",
    },
  ];

  const bonusScore = bonus.reduce((sum, b) => sum + b.points, 0);
  const maxBonusScore = bonus.reduce((sum, b) => sum + b.maxPoints, 0);

  let level: "alto" | "medio" | "bajo";
  if (bonusScore >= 80) level = "alto";
  else if (bonusScore >= 50) level = "medio";
  else level = "bajo";

  return { mandatory, allMandatoryPassed, bonus, bonusScore, maxBonusScore, level };
}
