import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Filters } from "@/pages/Lotes";

interface Props {
  filters: Filters;
  totalCount: number;
  filteredCount: number;
  onApply: (f: Filters) => void;
  onClear: () => void;
}

const LotesFilterPanel = ({ filters, totalCount, filteredCount, onApply, onClear }: Props) => {
  const [local, setLocal] = useState<Filters>(filters);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const update = (key: keyof Filters, value: string) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Ciudad */}
        <div className="col-span-2">
          <Label className="mb-1 font-body text-xs text-muted-foreground">Ciudad</Label>
          <Select value={local.ciudad} onValueChange={(v) => update("ciudad", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Medellín">Medellín</SelectItem>
              <SelectItem value="Bogotá" disabled>Bogotá — Próximamente</SelectItem>
              <SelectItem value="Cali" disabled>Cali — Próximamente</SelectItem>
              <SelectItem value="Barranquilla" disabled>Barranquilla — Próximamente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Uso de suelo */}
        <div>
          <Label className="mb-1 font-body text-xs text-muted-foreground">Uso de suelo</Label>
          <Select value={local.usoSuelo} onValueChange={(v) => update("usoSuelo", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Todos", "Residencial", "Comercial", "Mixto", "Industrial"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div>
          <Label className="mb-1 font-body text-xs text-muted-foreground">Estado</Label>
          <Select value={local.estado} onValueChange={(v) => update("estado", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Todos", "Disponible", "Reservado", "Vendido"].map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Área mínima */}
        <div>
          <Label className="mb-1 font-body text-xs text-muted-foreground">Área mín. m²</Label>
          <Input
            type="number"
            placeholder="0"
            value={local.areaMin}
            onChange={(e) => update("areaMin", e.target.value)}
          />
        </div>

        {/* Área máxima */}
        <div>
          <Label className="mb-1 font-body text-xs text-muted-foreground">Área máx. m²</Label>
          <Input
            type="number"
            placeholder="∞"
            value={local.areaMax}
            onChange={(e) => update("areaMax", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="default" size="sm" className="flex-1" onClick={() => onApply(local)}>
          Aplicar filtros
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onClear}>
          Limpiar filtros
        </Button>
      </div>

      <p className="mt-2 font-body text-xs text-muted-foreground">
        Mostrando {filteredCount} de {totalCount} lotes
      </p>
    </div>
  );
};

export default LotesFilterPanel;
