import {
  Briefcase,
  Building2,
  Construction,
  Home,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  ArquitectonicoLote,
  FinancieroLote,
  MercadoLote,
  NormativaLote,
} from "@/hooks/useFichaEnriquecida";

export interface PerfilCompradorIdeal {
  titulo: string;
  razon: string;
  icon: LucideIcon;
}

export interface ContextoPerfilComprador {
  areaTotalM2: number | null;
  scorePromedio: number | null;
  scoreNormativo: number | null;
  normativa: NormativaLote | null;
  arquitectonico: ArquitectonicoLote | null;
  financiero: FinancieroLote | null;
  mercado: MercadoLote | null;
}

/**
 * Deriva entre 1 y 3 perfiles de comprador ideal a partir de los datos del lote.
 * Función pura — no lee del DOM ni del cliente Supabase. Fácilmente testeable.
 */
export function derivarPerfilesCompradorIdeal(
  ctx: ContextoPerfilComprador,
): PerfilCompradorIdeal[] {
  const perfiles: PerfilCompradorIdeal[] = [];
  const area = ctx.areaTotalM2 ?? 0;
  const tir = ctx.financiero?.tir_pct ?? null;
  const altura = ctx.normativa?.altura_max_pisos ?? null;
  const uso = ctx.normativa?.uso_principal?.toLowerCase() ?? "";
  const unidades = ctx.arquitectonico?.unidades_estimadas ?? null;

  // Si el equipo de 360Lateral ya capturó un perfil narrativo, va primero.
  if (ctx.mercado?.perfil_comprador) {
    perfiles.push({
      titulo: "Perfil identificado por 360Lateral",
      razon: ctx.mercado.perfil_comprador,
      icon: Briefcase,
    });
  }

  // Regla 1: lote grande con TIR atractiva → desarrollador profesional
  if (area >= 1000 && tir != null && tir > 15) {
    perfiles.push({
      titulo: "Desarrollador inmobiliario profesional",
      razon: `Lote de ${area.toLocaleString("es-CO")} m² con TIR proyectada de ${tir.toFixed(1)}%. Adecuado para proyectos multifamiliares o de uso mixto${unidades ? ` (~${unidades} unidades estimadas)` : ""}.`,
      icon: Building2,
    });
  }

  // Regla 2: normativa favorable + altura → constructora con capacidad
  if (ctx.scoreNormativo != null && ctx.scoreNormativo >= 8 && altura != null && altura >= 8) {
    perfiles.push({
      titulo: "Constructora con capacidad financiera",
      razon: `Normativa favorable (score ${ctx.scoreNormativo.toFixed(1)}/10) con altura máxima de ${altura} pisos. Permite densificación.`,
      icon: Construction,
    });
  }

  // Regla 3: lote pequeño residencial → inversionista individual / family office
  if (area > 0 && area < 500 && uso.includes("residencial")) {
    perfiles.push({
      titulo: "Inversionista individual o family office",
      razon: `Lote de ${area.toLocaleString("es-CO")} m² con uso residencial. Ideal para vivienda unifamiliar de lujo o pequeño desarrollo.`,
      icon: Home,
    });
  }

  // Fallback
  if (perfiles.length === 0) {
    perfiles.push({
      titulo: "Solicita análisis personalizado con un asesor",
      razon:
        "Para identificar el comprador ideal de este lote, contacta a 360Lateral para una evaluación detallada.",
      icon: MessageCircle,
    });
  }

  return perfiles.slice(0, 3);
}
