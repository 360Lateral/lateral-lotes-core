import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { FiltrosMercado as Filtros } from "@/hooks/useMercadoPublico";
import {
  CATEGORIAS_AREA,
  RANGOS_PRECIO,
  formatearCategoriaArea,
  formatearRangoPrecio,
} from "@/lib/mercado-format";

interface Props {
  value: Filtros;
  onChange: (v: Filtros) => void;
  ciudadesDisponibles?: string[];
}

const FiltrosMercado = ({ value, onChange, ciudadesDisponibles = [] }: Props) => {
  const toggleArr = (key: "categoria_area" | "rango_precio", item: string) => {
    const current = value[key] ?? [];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    onChange({ ...value, [key]: next.length ? next : undefined });
  };

  const limpiar = () => onChange({});

  const hayFiltros =
    !!value.ciudad ||
    !!value.barrio ||
    !!value.uso_actual ||
    !!value.categoria_area?.length ||
    !!value.rango_precio?.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {ciudadesDisponibles.length > 0 ? (
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            value={value.ciudad ?? ""}
            onChange={(e) => onChange({ ...value, ciudad: e.target.value || undefined })}
          >
            <option value="">Todas las ciudades</option>
            {ciudadesDisponibles.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <Input
            placeholder="Ciudad"
            value={value.ciudad ?? ""}
            onChange={(e) => onChange({ ...value, ciudad: e.target.value || undefined })}
            className="sm:max-w-xs"
          />
        )}
        <Input
          placeholder="Barrio"
          value={value.barrio ?? ""}
          onChange={(e) => onChange({ ...value, barrio: e.target.value || undefined })}
          className="sm:max-w-xs"
        />
        <Input
          placeholder="Uso (residencial, comercial...)"
          value={value.uso_actual ?? ""}
          onChange={(e) => onChange({ ...value, uso_actual: e.target.value || undefined })}
          className="sm:max-w-xs"
        />
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar} className="sm:ml-auto">
            <X className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Tamaño</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_AREA.map((cat) => {
            const active = value.categoria_area?.includes(cat) ?? false;
            return (
              <Badge
                key={cat}
                variant={active ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleArr("categoria_area", cat)}
              >
                {formatearCategoriaArea(cat)}
              </Badge>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Rango de precio</p>
        <div className="flex flex-wrap gap-2">
          {RANGOS_PRECIO.map((r) => {
            const active = value.rango_precio?.includes(r) ?? false;
            return (
              <Badge
                key={r}
                variant={active ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleArr("rango_precio", r)}
              >
                {formatearRangoPrecio(r)}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FiltrosMercado;
