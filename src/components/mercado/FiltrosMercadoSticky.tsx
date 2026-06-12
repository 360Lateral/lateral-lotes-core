import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import FiltrosMercado from "./FiltrosMercado";
import type { FiltrosMercado as Filtros } from "@/hooks/useMercadoPublico";

interface Props {
  value: Filtros;
  onChange: (v: Filtros) => void;
  ciudadesDisponibles?: string[];
  sticky?: boolean;
}

const FiltrosMercadoSticky = ({ value, onChange, ciudadesDisponibles = [], sticky = true }: Props) => {
  const hayFiltros = Object.values(value).some(
    (v) => v != null && (Array.isArray(v) ? v.length > 0 : v !== ""),
  );

  return (
    <aside className={sticky ? "lg:sticky lg:top-20" : ""}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-secondary">Filtros</h2>
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={() => onChange({})}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        <FiltrosMercado
          value={value}
          onChange={onChange}
          ciudadesDisponibles={ciudadesDisponibles}
        />
      </div>
    </aside>
  );
};

export default FiltrosMercadoSticky;
