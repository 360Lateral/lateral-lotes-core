import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FiltrosMercado } from "@/hooks/useMercadoPublico";
import { formatearCategoriaArea, formatearRangoPrecio } from "@/lib/mercado-format";

export type OrdenMercado = "recientes" | "precio_asc" | "precio_desc" | "area_desc";

interface Props {
  total: number;
  filtros: FiltrosMercado;
  onRemoveFiltro: (key: keyof FiltrosMercado, value?: string) => void;
  orden: OrdenMercado;
  onOrdenChange: (v: OrdenMercado) => void;
}

const labelFiltro = (key: keyof FiltrosMercado, value: string): string => {
  if (key === "categoria_area") return formatearCategoriaArea(value);
  if (key === "rango_precio") return formatearRangoPrecio(value);
  if (key === "ciudad") return `Ciudad: ${value}`;
  if (key === "barrio") return `Barrio: ${value}`;
  if (key === "uso_actual") return `Uso: ${value}`;
  return value;
};

const ResultadosHeader = ({ total, filtros, onRemoveFiltro, orden, onOrdenChange }: Props) => {
  const chips: Array<{ key: keyof FiltrosMercado; value: string }> = [];
  (Object.keys(filtros) as Array<keyof FiltrosMercado>).forEach((k) => {
    const v = filtros[k];
    if (Array.isArray(v)) v.forEach((x) => chips.push({ key: k, value: x }));
    else if (typeof v === "string" && v) chips.push({ key: k, value: v });
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-secondary">
          {total} {total === 1 ? "activo" : "activos"}
        </span>
        {chips.map((c) => (
          <Badge
            key={`${c.key}-${c.value}`}
            variant="secondary"
            className="cursor-pointer gap-1 hover:bg-secondary/80"
            onClick={() => onRemoveFiltro(c.key, c.value)}
          >
            {labelFiltro(c.key, c.value)}
            <X className="h-3 w-3" />
          </Badge>
        ))}
      </div>

      <Select value={orden} onValueChange={(v) => onOrdenChange(v as OrdenMercado)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recientes">Más recientes</SelectItem>
          <SelectItem value="precio_asc">Precio: menor a mayor</SelectItem>
          <SelectItem value="precio_desc">Precio: mayor a menor</SelectItem>
          <SelectItem value="area_desc">Área: mayor a menor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResultadosHeader;
