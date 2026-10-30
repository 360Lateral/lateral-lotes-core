import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";
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
    !!value.uso_actual ||
    !!value.categoria_area?.length ||
    !!value.rango_precio?.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 md:space-y-0 md:flex md:flex-col md:gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:contents">
        <div className="md:order-1 md:w-full md:min-w-0">
        <label htmlFor="mercado-ciudad" className="hidden md:block text-xs font-medium text-muted-foreground mb-2">Ciudad</label>
        {ciudadesDisponibles.length > 0 || window.matchMedia("(min-width: 768px)").matches ? (
          <select
            id="mercado-ciudad"
            aria-label="Ciudad"
            className="h-10 md:w-full md:min-w-0 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
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
            id="mercado-ciudad"
            placeholder="Ciudad"
            value={value.ciudad ?? ""}
            onChange={(e) => onChange({ ...value, ciudad: e.target.value || undefined })}
            className="sm:max-w-xs md:max-w-none"
          />
        )}
        </div>
        <div className="md:order-4 md:w-full md:min-w-0">
        <label htmlFor="mercado-uso" className="hidden md:block text-xs font-medium text-muted-foreground mb-2">Uso</label>
        <Input
          id="mercado-uso"
          aria-label="Uso"
          placeholder="Residencial, comercial..."
          value={value.uso_actual ?? ""}
          onChange={(e) => onChange({ ...value, uso_actual: e.target.value || undefined })}
          className="sm:max-w-xs md:max-w-none md:w-full md:min-w-0 h-10"
        />
        </div>
        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar} className="sm:ml-auto md:hidden">
            <X className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      <div className="md:order-2 md:w-full">
        <p className="text-xs font-medium text-muted-foreground mb-2">Tamaño</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_AREA.map((cat) => {
            const active = value.categoria_area?.includes(cat) ?? false;
            return (
              <Button
                key={cat}
                variant={active ? "default" : "outline"}
                size="sm"
                aria-pressed={active}
                className={`${badgeVariants({ variant: active ? "default" : "outline" })} h-auto min-h-0 md:min-h-10 md:whitespace-normal md:text-left md:justify-start`}
                onClick={() => toggleArr("categoria_area", cat)}
              >
                {formatearCategoriaArea(cat)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="md:order-3 md:w-full">
        <p className="text-xs font-medium text-muted-foreground mb-2">Rango de precio</p>
        <div className="flex flex-wrap gap-2">
          {RANGOS_PRECIO.map((r) => {
            const active = value.rango_precio?.includes(r) ?? false;
            return (
              <Button
                key={r}
                variant={active ? "default" : "outline"}
                size="sm"
                aria-pressed={active}
                className={`${badgeVariants({ variant: active ? "default" : "outline" })} h-auto min-h-0 md:min-h-10 md:whitespace-normal md:text-left md:justify-start`}
                onClick={() => toggleArr("rango_precio", r)}
              >
                {formatearRangoPrecio(r)}
              </Button>
            );
          })}
        </div>
      </div>
      <Button variant="outline" onClick={limpiar} className="hidden md:flex md:order-5 w-full min-h-10">
        <X className="h-4 w-4" /> Limpiar filtros
      </Button>
    </div>
  );
};

export default FiltrosMercado;
