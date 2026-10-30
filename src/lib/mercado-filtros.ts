import type { FiltrosMercado } from "@/hooks/useMercadoPublico";

// Whitelist supported filters so retired fields cannot survive persisted searches.
export function normalizarFiltrosMercado(value: FiltrosMercado): FiltrosMercado {
  const next: FiltrosMercado = {};
  if (value.ciudad) next.ciudad = value.ciudad;
  if (value.categoria_area?.length) next.categoria_area = value.categoria_area;
  if (value.rango_precio?.length) next.rango_precio = value.rango_precio;
  if (value.uso_actual) next.uso_actual = value.uso_actual;
  return next;
}