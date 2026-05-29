import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface FiltrosLotesState {
  q: string;
  ciudad: string;
  barrio: string;
  tipo: string;
  plan: string;
  estado: string;
  areaMin: string;
  areaMax: string;
  precioMin: string;
  precioMax: string;
  propietario: "todos" | "con" | "sin";
  publicacion: "todos" | "publicos" | "no_publicos";
  soloDestacados: boolean;
}

export const FILTROS_INICIALES: FiltrosLotesState = {
  q: "", ciudad: "__all__", barrio: "", tipo: "__all__", plan: "__all__", estado: "__all__",
  areaMin: "", areaMax: "", precioMin: "", precioMax: "",
  propietario: "todos", publicacion: "todos", soloDestacados: false,
};

interface Props {
  value: FiltrosLotesState;
  onChange: (next: FiltrosLotesState) => void;
  onClear: () => void;
  ciudades: string[];
  tipos: string[];
  planes: { codigo: string; nombre: string }[];
  estados: string[];
}

const FiltrosLotesAvanzados = ({ value, onChange, onClear, ciudades, tipos, planes, estados }: Props) => {
  const upd = <K extends keyof FiltrosLotesState>(k: K, v: FiltrosLotesState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div className="relative md:col-span-2 lg:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o barrio…"
            value={value.q}
            onChange={(e) => upd("q", e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={value.ciudad} onValueChange={(v) => upd("ciudad", v)}>
          <SelectTrigger><SelectValue placeholder="Ciudad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las ciudades</SelectItem>
            {ciudades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          placeholder="Sector / barrio"
          value={value.barrio}
          onChange={(e) => upd("barrio", e.target.value)}
        />

        <Select value={value.tipo} onValueChange={(v) => upd("tipo", v)}>
          <SelectTrigger><SelectValue placeholder="Uso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Cualquier uso</SelectItem>
            {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.plan} onValueChange={(v) => upd("plan", v)}>
          <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los planes</SelectItem>
            {planes.map((p) => <SelectItem key={p.codigo} value={p.codigo}>{p.nombre}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.estado} onValueChange={(v) => upd("estado", v)}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            {estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          <Input
            type="number" inputMode="numeric" placeholder="Área min m²"
            value={value.areaMin} onChange={(e) => upd("areaMin", e.target.value)}
          />
          <Input
            type="number" inputMode="numeric" placeholder="Área max m²"
            value={value.areaMax} onChange={(e) => upd("areaMax", e.target.value)}
          />
        </div>

        <div className="flex gap-1">
          <Input
            type="number" inputMode="numeric" placeholder="Precio min"
            value={value.precioMin} onChange={(e) => upd("precioMin", e.target.value)}
          />
          <Input
            type="number" inputMode="numeric" placeholder="Precio max"
            value={value.precioMax} onChange={(e) => upd("precioMax", e.target.value)}
          />
        </div>

        <Select value={value.propietario} onValueChange={(v) => upd("propietario", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los propietarios</SelectItem>
            <SelectItem value="con">Con propietario</SelectItem>
            <SelectItem value="sin">Sin propietario</SelectItem>
          </SelectContent>
        </Select>

        <Select value={value.publicacion} onValueChange={(v) => upd("publicacion", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="publicos">Solo públicos</SelectItem>
            <SelectItem value="no_publicos">No públicos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="destacados"
            checked={value.soloDestacados}
            onCheckedChange={(v) => upd("soloDestacados", v)}
          />
          <Label htmlFor="destacados" className="text-sm">Solo destacados</Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Limpiar filtros
        </Button>
      </div>
    </div>
  );
};

export default FiltrosLotesAvanzados;
