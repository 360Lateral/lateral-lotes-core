export const formatearCategoriaArea = (cat: string): string => {
  const map: Record<string, string> = {
    pequeño: "Pequeño (<500m²)",
    mediano: "Mediano (500–1500m²)",
    grande: "Grande (1500–5000m²)",
    extra_grande: "Extra grande (+5000m²)",
    desconocida: "Sin dato",
  };
  return map[cat] ?? cat;
};

export const formatearRangoPrecio = (rango: string): string => {
  const map: Record<string, string> = {
    rango_1: "Hasta $200M",
    rango_2: "$200M – $500M",
    rango_3: "$500M – $1.000M",
    rango_4: "$1.000M – $3.000M",
    rango_5: "Más de $3.000M",
    no_disponible: "Consultar",
  };
  return map[rango] ?? rango;
};

export const CATEGORIAS_AREA = ["pequeño", "mediano", "grande", "extra_grande"] as const;
export const RANGOS_PRECIO = ["rango_1", "rango_2", "rango_3", "rango_4", "rango_5"] as const;
