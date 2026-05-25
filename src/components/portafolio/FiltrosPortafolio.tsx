import { useEffect, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAsesoresList } from "@/hooks/useAsesoresList";
import type { PortafolioFiltrosUI } from "@/hooks/useVistaPortafolio";

interface Props {
  filtros: PortafolioFiltrosUI;
  onChangeFiltros: (f: PortafolioFiltrosUI) => void;
}

const PLANES = [
  { value: "gratuito", label: "Gratuito" },
  { value: "basico", label: "Básico" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "prospecto", label: "Prospecto" },
  { value: "en_progreso", label: "En progreso" },
  { value: "activo", label: "Activo" },
  { value: "en_revision", label: "En revisión" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

const ACTIVACION = [
  { value: "borrador", label: "Borrador" },
  { value: "pendiente_pago", label: "Pendiente pago" },
  { value: "activo", label: "Activo" },
];

const SEMAFOROS = [
  { value: "verde", label: "Verde", dot: "bg-success" },
  { value: "amarillo", label: "Amarillo", dot: "bg-warning" },
  { value: "rojo", label: "Rojo", dot: "bg-destructive" },
];

const MultiDropdown = ({
  label,
  options,
  selected,
  onChange,
  renderDot,
}: {
  label: string;
  options: { value: string; label: string; dot?: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  renderDot?: boolean;
}) => {
  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((s) => s !== v));
    else onChange([...selected, v]);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-body">
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="ml-1 h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={selected.includes(o.value)}
            onCheckedChange={() => toggle(o.value)}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex items-center gap-2">
              {renderDot && o.dot && (
                <span className={`inline-block h-2 w-2 rounded-full ${o.dot}`} />
              )}
              {o.label}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FiltrosPortafolio = ({ filtros, onChangeFiltros }: Props) => {
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda ?? "");
  const { data: asesores = [] } = useAsesoresList();

  useEffect(() => {
    const t = setTimeout(() => {
      if ((filtros.busqueda ?? "") !== busquedaLocal) {
        onChangeFiltros({ ...filtros, busqueda: busquedaLocal });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaLocal]);

  const conteo =
    (filtros.plan?.length ?? 0) +
    (filtros.estado?.length ?? 0) +
    (filtros.semaforo?.length ?? 0) +
    (filtros.asesor_id ? 1 : 0) +
    (filtros.busqueda && filtros.busqueda.length >= 2 ? 1 : 0);

  const limpiar = () => {
    setBusquedaLocal("");
    onChangeFiltros({});
  };

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-body text-sm font-semibold text-foreground">
          Filtros
        </span>
        {conteo > 0 && (
          <Badge variant="secondary" className="h-5 px-2 font-body text-xs">
            {conteo} activos
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busquedaLocal}
            onChange={(e) => setBusquedaLocal(e.target.value)}
            placeholder="Buscar por lote, dirección o cliente…"
            className="pl-8"
          />
        </div>

        <MultiDropdown
          label="Plan"
          options={PLANES}
          selected={filtros.plan ?? []}
          onChange={(v) => onChangeFiltros({ ...filtros, plan: v })}
        />
        <MultiDropdown
          label="Estado"
          options={ESTADOS}
          selected={filtros.estado ?? []}
          onChange={(v) => onChangeFiltros({ ...filtros, estado: v })}
        />

        <Select
          value={filtros.asesor_id ?? "__all__"}
          onValueChange={(v) =>
            onChangeFiltros({
              ...filtros,
              asesor_id: v === "__all__" ? undefined : v,
            })
          }
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Todos los asesores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los asesores</SelectItem>
            {asesores.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MultiDropdown
          label="Semáforo SLA"
          options={SEMAFOROS}
          selected={filtros.semaforo ?? []}
          onChange={(v) => onChangeFiltros({ ...filtros, semaforo: v })}
          renderDot
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={limpiar}
          disabled={conteo === 0}
          className="font-body"
        >
          <X className="h-4 w-4" />
          Limpiar filtros
        </Button>
      </div>
    </Card>
  );
};

export default FiltrosPortafolio;
