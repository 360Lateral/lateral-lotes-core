import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  MapPin,
  Ruler,
  Tag,
  Briefcase,
  BarChart3,
  Users,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { useFiltroOpcionesDisponibles } from "@/hooks/useFiltroOpcionesDisponibles";
import type {
  FiltrosUnificados,
  CategoriaArea,
} from "@/hooks/useDashboardUnificado";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: FiltrosUnificados;
  onAplicar: (filtros: FiltrosUnificados) => void;
}

const SeccionColapsable = ({
  titulo,
  icono: Icono,
  defaultOpen = false,
  contador = 0,
  children,
}: {
  titulo: string;
  icono: any;
  defaultOpen?: boolean;
  contador?: number;
  children: React.ReactNode;
}) => {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <Collapsible open={abierto} onOpenChange={setAbierto} className="border-b border-border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-3 text-left">
        <div className="flex items-center gap-2">
          <Icono className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{titulo}</span>
          {contador > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">
              {contador}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        <div className="space-y-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
      active
        ? "border border-primary bg-primary/15 text-primary"
        : "border border-border bg-background text-muted-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const Campo = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

export const FiltrosAvanzadosLotesSheet = ({
  open,
  onOpenChange,
  valor,
  onAplicar,
}: Props) => {
  const [borrador, setBorrador] = useState<FiltrosUnificados>(valor);
  const { data: opciones } = useFiltroOpcionesDisponibles();

  useEffect(() => {
    if (open) setBorrador(valor);
  }, [open, valor]);

  const upd = <K extends keyof FiltrosUnificados>(k: K, v: FiltrosUnificados[K]) =>
    setBorrador((prev) => ({ ...prev, [k]: v }));

  const toggle = <T,>(arr: T[] | undefined, item: T): T[] => {
    const set = new Set(arr ?? []);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    return Array.from(set);
  };

  const limpiar = () =>
    setBorrador({ busqueda: borrador.busqueda, filtro: borrador.filtro });

  const cUbic = (borrador.ciudades?.length ?? 0) + (borrador.barrios?.length ?? 0);
  const cCar =
    (borrador.tipos?.length ?? 0) +
    (borrador.categoriaArea?.length ?? 0) +
    (borrador.areaMin != null ? 1 : 0) +
    (borrador.areaMax != null ? 1 : 0) +
    (borrador.precioMin != null ? 1 : 0) +
    (borrador.precioMax != null ? 1 : 0) +
    (borrador.estratos?.length ?? 0);
  const cEst =
    (borrador.estadosPublicacion?.length ?? 0) +
    (borrador.estadoDisponibilidad?.length ?? 0) +
    (borrador.soloPublicos ? 1 : 0) +
    (borrador.soloDestacados ? 1 : 0);
  const cEng =
    (borrador.planesCodigos?.length ?? 0) +
    (borrador.estadosEngagement?.length ?? 0) +
    (borrador.asesoresIds?.length ?? 0) +
    (borrador.slaEstados?.length ?? 0) +
    (borrador.conEntregablesBorrador ? 1 : 0);
  const cAna =
    (borrador.scoreMin != null && borrador.scoreMin > 0 ? 1 : 0) +
    (borrador.conResolutoria ? 1 : 0) +
    (borrador.propietarioId ? 1 : 0) +
    (borrador.conLeadsActivos ? 1 : 0) +
    (borrador.leadsMinimo != null ? 1 : 0);
  const cFec =
    (borrador.creadoDesde ? 1 : 0) +
    (borrador.creadoHasta ? 1 : 0) +
    (borrador.ultimaActividadDias ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-base">Filtros avanzados</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limpiar}
              className="h-7 gap-1 text-[11px]"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <SeccionColapsable titulo="Ubicación" icono={MapPin} contador={cUbic} defaultOpen>
            <Campo label="Ciudad">
              <div className="flex flex-wrap gap-1">
                {(opciones?.ciudades ?? []).map((c) => (
                  <Chip
                    key={c}
                    active={!!borrador.ciudades?.includes(c)}
                    onClick={() => upd("ciudades", toggle(borrador.ciudades, c))}
                  >
                    {c}
                  </Chip>
                ))}
                {(opciones?.ciudades ?? []).length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Sin opciones</p>
                )}
              </div>
            </Campo>
            <Campo label="Barrio">
              <div className="flex flex-wrap gap-1">
                {(opciones?.barrios ?? []).slice(0, 80).map((b) => (
                  <Chip
                    key={b}
                    active={!!borrador.barrios?.includes(b)}
                    onClick={() => upd("barrios", toggle(borrador.barrios, b))}
                  >
                    {b}
                  </Chip>
                ))}
              </div>
            </Campo>
          </SeccionColapsable>

          <SeccionColapsable titulo="Características" icono={Ruler} contador={cCar}>
            <Campo label="Categoría de área">
              <div className="flex flex-wrap gap-1">
                {(["pequeño", "mediano", "grande", "extra_grande"] as CategoriaArea[]).map(
                  (c) => (
                    <Chip
                      key={c}
                      active={!!borrador.categoriaArea?.includes(c)}
                      onClick={() =>
                        upd("categoriaArea", toggle(borrador.categoriaArea, c))
                      }
                    >
                      {c.replace("_", " ")}
                    </Chip>
                  ),
                )}
              </div>
            </Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Área mín (m²)">
                <Input
                  type="number"
                  value={borrador.areaMin ?? ""}
                  onChange={(e) =>
                    upd("areaMin", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="h-8 text-xs"
                />
              </Campo>
              <Campo label="Área máx (m²)">
                <Input
                  type="number"
                  value={borrador.areaMax ?? ""}
                  onChange={(e) =>
                    upd("areaMax", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="h-8 text-xs"
                />
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Precio mín (COP)">
                <Input
                  type="number"
                  value={borrador.precioMin ?? ""}
                  onChange={(e) =>
                    upd("precioMin", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="h-8 text-xs"
                />
              </Campo>
              <Campo label="Precio máx (COP)">
                <Input
                  type="number"
                  value={borrador.precioMax ?? ""}
                  onChange={(e) =>
                    upd("precioMax", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="h-8 text-xs"
                />
              </Campo>
            </div>
            <Campo label="Tipo de lote">
              <div className="flex flex-wrap gap-1">
                {(opciones?.tipos ?? []).map((t) => (
                  <Chip
                    key={t}
                    active={!!borrador.tipos?.includes(t)}
                    onClick={() => upd("tipos", toggle(borrador.tipos, t))}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </Campo>
            <Campo label="Estrato">
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5, 6].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => upd("estratos", toggle(borrador.estratos, e))}
                    className={`h-7 w-7 rounded-full text-[11px] font-semibold transition-colors ${
                      borrador.estratos?.includes(e)
                        ? "border border-primary bg-primary/15 text-primary"
                        : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Campo>
          </SeccionColapsable>

          <SeccionColapsable titulo="Estado de publicación" icono={Tag} contador={cEst}>
            <Campo label="Estado de publicación">
              <div className="flex flex-wrap gap-1">
                {(
                  ["borrador", "pendiente_validacion", "aprobado", "rechazado"] as const
                ).map((s) => (
                  <Chip
                    key={s}
                    active={!!borrador.estadosPublicacion?.includes(s)}
                    onClick={() =>
                      upd("estadosPublicacion", toggle(borrador.estadosPublicacion, s))
                    }
                  >
                    {s.replace("_", " ")}
                  </Chip>
                ))}
              </div>
            </Campo>
            <Campo label="Disponibilidad">
              <div className="flex flex-wrap gap-1">
                {(["Disponible", "Reservado", "Vendido"] as const).map((s) => (
                  <Chip
                    key={s}
                    active={!!borrador.estadoDisponibilidad?.includes(s)}
                    onClick={() =>
                      upd("estadoDisponibilidad", toggle(borrador.estadoDisponibilidad, s))
                    }
                  >
                    {s}
                  </Chip>
                ))}
              </div>
            </Campo>
            <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
              <span className="text-[11px] text-foreground">Solo públicos en mercado</span>
              <Switch
                checked={!!borrador.soloPublicos}
                onCheckedChange={(v) => upd("soloPublicos", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
              <span className="text-[11px] text-foreground">Solo destacados</span>
              <Switch
                checked={!!borrador.soloDestacados}
                onCheckedChange={(v) => upd("soloDestacados", v)}
              />
            </div>
          </SeccionColapsable>

          <SeccionColapsable titulo="Engagement" icono={Briefcase} contador={cEng}>
            <Campo label="Plan">
              <div className="flex flex-wrap gap-1">
                {(opciones?.planes ?? []).map((p) => (
                  <Chip
                    key={p.codigo}
                    active={!!borrador.planesCodigos?.includes(p.codigo)}
                    onClick={() =>
                      upd("planesCodigos", toggle(borrador.planesCodigos, p.codigo))
                    }
                  >
                    {p.nombre}
                  </Chip>
                ))}
              </div>
            </Campo>
            <Campo label="Estado del engagement">
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    "prospecto",
                    "activo",
                    "en_revision",
                    "entregado",
                    "cerrado",
                    "cancelado",
                  ] as const
                ).map((s) => (
                  <Chip
                    key={s}
                    active={!!borrador.estadosEngagement?.includes(s)}
                    onClick={() =>
                      upd("estadosEngagement", toggle(borrador.estadosEngagement, s))
                    }
                  >
                    {s.replace("_", " ")}
                  </Chip>
                ))}
              </div>
            </Campo>
            <Campo label="Asesor asignado">
              <div className="flex flex-wrap gap-1">
                {(opciones?.asesores ?? []).map((a) => (
                  <Chip
                    key={a.id}
                    active={!!borrador.asesoresIds?.includes(a.id)}
                    onClick={() =>
                      upd("asesoresIds", toggle(borrador.asesoresIds, a.id))
                    }
                  >
                    {a.nombre}
                  </Chip>
                ))}
              </div>
            </Campo>
            <Campo label="Estado SLA">
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { v: "cumplido_a_tiempo", l: "Cumplido a tiempo" },
                    { v: "cumplido_con_retraso", l: "Cumplido con retraso" },
                    { v: "atrasado", l: "Atrasado" },
                    { v: "riesgo_fecha", l: "En riesgo" },
                    { v: "riesgo_ritmo", l: "Ritmo lento" },
                    { v: "verde", l: "En tiempo" },
                  ] as const
                ).map((s) => (
                  <Chip
                    key={s.v}
                    active={!!borrador.slaEstados?.includes(s.v as any)}
                    onClick={() =>
                      upd("slaEstados", toggle(borrador.slaEstados, s.v as any))
                    }
                  >
                    {s.l}
                  </Chip>
                ))}
              </div>
            </Campo>
            <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
              <span className="text-[11px] text-foreground">Con entregables en borrador</span>
              <Switch
                checked={!!borrador.conEntregablesBorrador}
                onCheckedChange={(v) => upd("conEntregablesBorrador", v)}
              />
            </div>
          </SeccionColapsable>

          <SeccionColapsable titulo="Análisis 360° y relaciones" icono={BarChart3} contador={cAna}>
            <Campo label={`Score 360° mínimo: ${borrador.scoreMin ?? 0}`}>
              <Slider
                value={[borrador.scoreMin ?? 0]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={(v) => upd("scoreMin", v[0] || undefined)}
              />
            </Campo>
            <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
              <span className="text-[11px] text-foreground">Solo con Resolutoría</span>
              <Switch
                checked={!!borrador.conResolutoria}
                onCheckedChange={(v) => upd("conResolutoria", v)}
              />
            </div>
            <Campo label="Propietario">
              <select
                value={borrador.propietarioId ?? ""}
                onChange={(e) => upd("propietarioId", e.target.value || undefined)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">Cualquiera</option>
                <option value="__sin__">Sin propietario asignado</option>
                {(opciones?.propietarios ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
              <span className="text-[11px] text-foreground">Con leads activos</span>
              <Switch
                checked={!!borrador.conLeadsActivos}
                onCheckedChange={(v) => upd("conLeadsActivos", v)}
              />
            </div>
            <Campo label="Mínimo de leads">
              <Input
                type="number"
                value={borrador.leadsMinimo ?? ""}
                onChange={(e) =>
                  upd("leadsMinimo", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-xs"
              />
            </Campo>
          </SeccionColapsable>

          <SeccionColapsable titulo="Fechas" icono={Calendar} contador={cFec}>
            <div className="grid grid-cols-2 gap-2">
              <Campo label="Creado desde">
                <Input
                  type="date"
                  value={borrador.creadoDesde ?? ""}
                  onChange={(e) => upd("creadoDesde", e.target.value || undefined)}
                  className="h-8 text-xs"
                />
              </Campo>
              <Campo label="Creado hasta">
                <Input
                  type="date"
                  value={borrador.creadoHasta ?? ""}
                  onChange={(e) => upd("creadoHasta", e.target.value || undefined)}
                  className="h-8 text-xs"
                />
              </Campo>
            </div>
            <Campo label="Actividad en últimos N días">
              <Input
                type="number"
                value={borrador.ultimaActividadDias ?? ""}
                onChange={(e) =>
                  upd(
                    "ultimaActividadDias",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder="ej: 7"
                className="h-8 text-xs"
              />
            </Campo>
          </SeccionColapsable>
        </div>

        <div className="flex gap-2 border-t border-border bg-background p-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              onAplicar(borrador);
              onOpenChange(false);
            }}
          >
            <Users className="hidden" /> Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
