import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Briefcase,
  ChevronDown,
  Wallet,
  Inbox,
  Send,
  Trophy,
  Coins,
  Clock,
  MapPin,
  Check,
  X,
  LayoutGrid,
  List,
  Filter,
  FileText,
} from "lucide-react";
import { useMisOrdenesExperto } from "@/hooks/useMisOrdenesExperto";
import { useMisPropuestas } from "@/hooks/useMisPropuestas";
import { useTengoPropuestaEnOrden } from "@/hooks/useTengoPropuestaEnOrden";
import { useRetirarPropuesta } from "@/hooks/useRetirarPropuesta";
import { useMisLiquidaciones } from "@/hooks/useMisLiquidaciones";
import PostularmeDialog from "@/components/ordenes/PostularmeDialog";
import MiDesempenoPanel from "@/components/ordenes/MiDesempenoPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useResumenExperto } from "@/hooks/experto/useResumenExperto";
import { MetricaOverview } from "@/components/ui/MetricaOverview";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOPCompact } from "@/lib/format";
import {
import { formatCOP } from "@/lib/format-moneda";
  FiltrosOrdenesSticky,
  defaultFiltrosOrdenes,
  contarFiltrosActivos,
  type FiltrosOrdenes,
} from "@/components/ordenes/FiltrosOrdenesSticky";

const fmtFecha = (d: string) => new Date(d).toLocaleDateString("es-CO");

const KEY_FILTROS = "experto_filtros_ordenes";
const KEY_ORDEN = "experto_orden_ordenes";
const KEY_VISTA = "experto_vista_ordenes";

type OrdenSort = "urgencia" | "precio-asc" | "recientes";
type VistaOrdenes = "grid" | "lista";

const OrdenDisponibleCard = ({
  orden,
  onPostular,
  onIrAMisPropuestas,
}: {
  orden: any;
  onPostular: (o: any) => void;
  onIrAMisPropuestas: () => void;
}) => {
  const { data: tengo } = useTengoPropuestaEnOrden(orden.id);
  const fechaLimite = orden.fecha_limite_propuestas ? new Date(orden.fecha_limite_propuestas) : null;
  const diasRest = fechaLimite
    ? Math.ceil((fechaLimite.getTime() - Date.now()) / 86400000)
    : null;
  const cerrada = diasRest !== null && diasRest < 0;
  const urgente = diasRest !== null && diasRest >= 0 && diasRest <= 3;
  const yaPostulo = tengo && tengo.estado !== "retirada";

  return (
    <div
      className={`rounded-md border bg-background p-3 transition-shadow hover:shadow-sm ${
        urgente ? "border-border border-l-[3px] border-l-primary" : "border-border"
      } ${yaPostulo ? "opacity-90" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {orden.tipo?.nombre && (
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">
              {orden.tipo.nombre}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              orden.visibilidad === "publica"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-primary/15 text-primary"
            }`}
          >
            {orden.visibilidad === "publica" ? "Pública" : "Invitación"}
          </span>
        </div>
        {diasRest !== null && !cerrada && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              urgente ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <Clock className="h-2.5 w-2.5" />
            {diasRest} {diasRest === 1 ? "día" : "días"}
          </span>
        )}
        {cerrada && (
          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
            Cerrada
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-foreground">{orden.lote?.nombre_lote ?? "—"}</h3>
      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="h-2.5 w-2.5" />
        {[orden.lote?.ciudad, orden.lote?.barrio].filter(Boolean).join(" · ") || "—"}
      </p>

      {orden.contrato && (
        <div className="my-3 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-2.5">
          <div>
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Precio</div>
            <div className="text-xs font-semibold text-foreground">
              {formatCOPCompact(Number(orden.contrato.precio_min))} –{" "}
              {formatCOPCompact(Number(orden.contrato.precio_max))}
            </div>
          </div>
          <div className="border-l border-border pl-2.5">
            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Plazo</div>
            <div className="text-xs font-semibold text-foreground">
              {orden.contrato.plazo_min_dias}–{orden.contrato.plazo_max_dias} días
            </div>
          </div>
        </div>
      )}

      {yaPostulo ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check className="h-2.5 w-2.5" />
            Ya postulaste
          </span>
          <Button size="sm" variant="outline" onClick={onIrAMisPropuestas} className="h-7 text-[11px]">
            Ver propuesta →
          </Button>
        </div>
      ) : cerrada ? (
        <Button size="sm" disabled className="w-full h-7 text-[11px]">
          Cerrada
        </Button>
      ) : (
        <Button size="sm" onClick={() => onPostular(orden)} className="w-full h-7 text-[11px]">
          Postularme →
        </Button>
      )}
    </div>
  );
};

const OrdenFila = ({
  orden,
  onPostular,
  onIrAMisPropuestas,
}: {
  orden: any;
  onPostular: (o: any) => void;
  onIrAMisPropuestas: () => void;
}) => {
  const { data: tengo } = useTengoPropuestaEnOrden(orden.id);
  const fechaLimite = orden.fecha_limite_propuestas ? new Date(orden.fecha_limite_propuestas) : null;
  const diasRest = fechaLimite
    ? Math.ceil((fechaLimite.getTime() - Date.now()) / 86400000)
    : null;
  const cerrada = diasRest !== null && diasRest < 0;
  const urgente = diasRest !== null && diasRest >= 0 && diasRest <= 3;
  const yaPostulo = tengo && tengo.estado !== "retirada";

  return (
    <tr className={urgente ? "border-l-[3px] border-l-primary" : ""}>
      <td className="px-3 py-2">
        <div className="font-medium text-foreground text-xs">{orden.lote?.nombre_lote ?? "—"}</div>
        <div className="text-[10px] text-muted-foreground">
          {[orden.lote?.ciudad, orden.lote?.barrio].filter(Boolean).join(" · ") || "—"}
        </div>
      </td>
      <td className="px-3 py-2 text-xs">{orden.tipo?.nombre ?? "—"}</td>
      <td className="px-3 py-2 text-xs capitalize">{orden.visibilidad}</td>
      <td className="px-3 py-2 text-right text-xs">
        {orden.contrato
          ? `${formatCOPCompact(Number(orden.contrato.precio_min))} – ${formatCOPCompact(Number(orden.contrato.precio_max))}`
          : "—"}
      </td>
      <td className="px-3 py-2 text-right text-xs">
        {orden.contrato ? `${orden.contrato.plazo_min_dias}–${orden.contrato.plazo_max_dias}d` : "—"}
      </td>
      <td className="px-3 py-2 text-right text-xs">
        {cerrada ? (
          <span className="text-destructive">Cerrada</span>
        ) : diasRest !== null ? (
          <span className={urgente ? "font-semibold text-primary" : "text-foreground"}>{diasRest}d</span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {yaPostulo ? (
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onIrAMisPropuestas}>
            Ver
          </Button>
        ) : cerrada ? (
          <Button size="sm" disabled className="h-7 text-[11px]">
            —
          </Button>
        ) : (
          <Button size="sm" className="h-7 text-[11px]" onClick={() => onPostular(orden)}>
            Postular
          </Button>
        )}
      </td>
    </tr>
  );
};

const OrdenesListaCompacta = ({
  ordenes,
  onPostular,
  onIrAMisPropuestas,
}: {
  ordenes: any[];
  onPostular: (o: any) => void;
  onIrAMisPropuestas: () => void;
}) => (
  <div className="overflow-x-auto rounded-md border border-border">
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="px-3 py-2 text-left">Lote</th>
          <th className="px-3 py-2 text-left">Tipo</th>
          <th className="px-3 py-2 text-left">Visibilidad</th>
          <th className="px-3 py-2 text-right">Precio</th>
          <th className="px-3 py-2 text-right">Plazo</th>
          <th className="px-3 py-2 text-right">Días</th>
          <th className="px-3 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border bg-background">
        {ordenes.map((o) => (
          <OrdenFila key={o.id} orden={o} onPostular={onPostular} onIrAMisPropuestas={onIrAMisPropuestas} />
        ))}
      </tbody>
    </table>
  </div>
);

const HeaderResultadosOrdenes = ({
  total,
  filtros,
  setFiltros,
  orden,
  onOrdenChange,
  vista,
  onVistaChange,
  tiposDisponibles,
}: {
  total: number;
  filtros: FiltrosOrdenes;
  setFiltros: (f: FiltrosOrdenes) => void;
  orden: OrdenSort;
  onOrdenChange: (o: OrdenSort) => void;
  vista: VistaOrdenes;
  onVistaChange: (v: VistaOrdenes) => void;
  tiposDisponibles: { id: string; nombre: string; count: number }[];
}) => {
  const filtrosActivos: { key: string; label: string; onRemove: () => void }[] = [];
  filtros.tipos.forEach((id) => {
    const t = tiposDisponibles.find((x) => x.id === id);
    if (t)
      filtrosActivos.push({
        key: `tipo-${id}`,
        label: t.nombre,
        onRemove: () => setFiltros({ ...filtros, tipos: filtros.tipos.filter((x) => x !== id) }),
      });
  });
  if (filtros.visibilidad !== "todas") {
    filtrosActivos.push({
      key: "vis",
      label: filtros.visibilidad === "publica" ? "Públicas" : "Por invitación",
      onRemove: () => setFiltros({ ...filtros, visibilidad: "todas" }),
    });
  }
  if (filtros.diasMaximo < 30) {
    filtrosActivos.push({
      key: "dias",
      label: `≤ ${filtros.diasMaximo} días`,
      onRemove: () => setFiltros({ ...filtros, diasMaximo: 30 }),
    });
  }
  if (filtros.precioMinimo > 0) {
    filtrosActivos.push({
      key: "precio",
      label: `≥ ${formatCOPCompact(filtros.precioMinimo)}`,
      onRemove: () => setFiltros({ ...filtros, precioMinimo: 0 }),
    });
  }

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{total} órdenes</span>
        {filtrosActivos.map((f) => (
          <span
            key={f.key}
            className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary"
          >
            {f.label}
            <button
              type="button"
              onClick={f.onRemove}
              aria-label={`Quitar filtro ${f.label}`}
              className="hover:text-primary/70"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Select value={orden} onValueChange={(v) => onOrdenChange(v as OrdenSort)}>
          <SelectTrigger className="h-7 w-auto text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgencia">Por urgencia</SelectItem>
            <SelectItem value="precio-asc">Precio ascendente</SelectItem>
            <SelectItem value="recientes">Recientes</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => onVistaChange("grid")}
            className={`p-1.5 transition-colors ${
              vista === "grid" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground"
            }`}
            aria-label="Vista grid"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onVistaChange("lista")}
            className={`p-1.5 transition-colors ${
              vista === "lista" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground"
            }`}
            aria-label="Vista lista"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PropuestaItem = ({ propuesta }: { propuesta: any }) => {
  const retirar = useRetirarPropuesta();
  const navigate = useNavigate();
  const [openMsg, setOpenMsg] = useState(false);

  const estadoBadge = () => {
    switch (propuesta.estado) {
      case "enviada":
        return <Badge variant="outline">En revisión</Badge>;
      case "ganadora":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600">Adjudicada — ejecuta el trabajo</Badge>;
      case "rechazada":
        return <Badge variant="destructive">No seleccionada</Badge>;
      case "retirada":
        return <Badge variant="secondary">Retirada</Badge>;
      default:
        return <Badge variant="outline">{propuesta.estado}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {estadoBadge()}
          <span className="text-xs text-muted-foreground">
            Enviada el {fmtFecha(propuesta.fecha_propuesta)}
          </span>
        </div>

        <div>
          <p className="font-semibold text-foreground">
            {propuesta.orden?.lote?.nombre_lote ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {propuesta.orden?.tipo?.nombre ?? "—"}
            {propuesta.orden?.lote?.ciudad ? ` · ${propuesta.orden.lote.ciudad}` : ""}
          </p>
        </div>

        <div className="text-sm grid grid-cols-2 gap-2">
          <p>
            <span className="text-muted-foreground">Precio: </span>
            <strong>{formatCOP(Number(propuesta.precio_propuesto))}</strong>
          </p>
          <p>
            <span className="text-muted-foreground">Plazo: </span>
            <strong>{propuesta.plazo_propuesto_dias} días</strong>
          </p>
        </div>

        {propuesta.mensaje_experto && (
          <Collapsible open={openMsg} onOpenChange={setOpenMsg}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <ChevronDown
                  className={`h-3 w-3 mr-1 transition-transform ${openMsg ? "rotate-180" : ""}`}
                />
                {openMsg ? "Ocultar mensaje" : "Ver mensaje"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/40 p-2 mt-1">
                {propuesta.mensaje_experto}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {propuesta.estado === "enviada" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Retirar propuesta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Retirar propuesta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Después podrás volver a postular si la orden sigue abierta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => retirar.mutate(propuesta.id)}>
                    Retirar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {propuesta.estado === "ganadora" && (
            <Button
              size="sm"
              onClick={() => navigate(`/dashboard/ordenes-servicio/${propuesta.orden_id}`)}
            >
              Ver orden
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MetodoPagoLabel: Record<string, string> = {
  transferencia: "Transferencia bancaria",
  nequi: "Nequi",
  daviplata: "Daviplata",
  otro: "Otro",
};

const LiquidacionItem = ({ liq }: { liq: any }) => {
  const estadoBadge = () => {
    switch (liq.estado) {
      case "pendiente":
        return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Pendiente de pago</Badge>;
      case "pagada":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600">Pagada</Badge>;
      case "cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{liq.estado}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {estadoBadge()}
          <span className="text-xs text-muted-foreground">
            Generada el {fmtFecha(liq.fecha_generacion)}
          </span>
        </div>

        <div>
          <p className="font-semibold text-foreground">
            {liq.orden?.lotes?.nombre_lote ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {liq.tipo?.nombre ?? "—"}
            {liq.orden?.lotes?.ciudad ? ` · ${liq.orden.lotes.ciudad}` : ""}
          </p>
        </div>

        <div className="rounded-md bg-muted/40 p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tu precio</span>
            <span>{formatCOP(Number(liq.monto_bruto))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Fee 360Lateral ({Number(liq.fee_pct)}%)</span>
            <span>−{formatCOP(Number(liq.fee_monto))}</span>
          </div>
          <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-emerald-700 dark:text-emerald-500">
            <span>Recibes</span>
            <span>{formatCOP(Number(liq.monto_neto))}</span>
          </div>
        </div>

        {liq.estado === "pagada" && liq.fecha_pago && (
          <p className="text-xs text-emerald-700 dark:text-emerald-500">
            Pagado el {fmtFecha(liq.fecha_pago)}
            {liq.metodo_pago ? ` vía ${MetodoPagoLabel[liq.metodo_pago] ?? liq.metodo_pago}` : ""}.
          </p>
        )}
        {liq.estado === "pendiente" && (
          <p className="text-xs text-muted-foreground">
            360Lateral procesará tu pago próximamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardMisOrdenes = () => {
  const [tab, setTab] = useState("disponibles");
  const [postularOrden, setPostularOrden] = useState<any | null>(null);
  const { data: ordenes = [], isLoading: loadingOrdenes } = useMisOrdenesExperto();
  const { data: propuestas = [], isLoading: loadingProps } = useMisPropuestas();
  const { data: liquidaciones = [], isLoading: loadingLiqs } = useMisLiquidaciones();
  const { user } = useAuth();
  const { data: resumenExperto } = useResumenExperto();
  const nombre =
    (user?.user_metadata as any)?.full_name ??
    user?.email?.split("@")[0] ??
    "Experto";

  // Persisted state
  const [filtros, setFiltros] = useState<FiltrosOrdenes>(() => {
    try {
      const raw = localStorage.getItem(KEY_FILTROS);
      if (raw) return { ...defaultFiltrosOrdenes, ...JSON.parse(raw) };
    } catch {}
    return defaultFiltrosOrdenes;
  });
  const [orden, setOrden] = useState<OrdenSort>(() => {
    try {
      return (localStorage.getItem(KEY_ORDEN) as OrdenSort) || "urgencia";
    } catch {
      return "urgencia";
    }
  });
  const [vista, setVista] = useState<VistaOrdenes>(() => {
    try {
      return (localStorage.getItem(KEY_VISTA) as VistaOrdenes) || "grid";
    } catch {
      return "grid";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY_FILTROS, JSON.stringify(filtros));
    } catch {}
  }, [filtros]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY_ORDEN, orden);
    } catch {}
  }, [orden]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY_VISTA, vista);
    } catch {}
  }, [vista]);

  // Tipos disponibles: derivar de las órdenes (keyed por nombre, ya que el hook no trae id)
  const tiposDisponibles = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; count: number }>();
    (ordenes as any[]).forEach((o) => {
      const nombre = o.tipo?.nombre;
      if (!nombre) return;
      const prev = map.get(nombre);
      if (prev) prev.count += 1;
      else map.set(nombre, { id: nombre, nombre, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ordenes]);

  const ordenesFiltradasYOrdenadas = useMemo(() => {
    const filtradas = (ordenes as any[]).filter((o) => {
      if (filtros.tipos.length > 0 && !filtros.tipos.includes(o.tipo?.nombre)) return false;
      if (filtros.visibilidad !== "todas" && o.visibilidad !== filtros.visibilidad) return false;
      if (o.fecha_limite_propuestas) {
        const d = Math.ceil(
          (new Date(o.fecha_limite_propuestas).getTime() - Date.now()) / 86400000
        );
        if (d > filtros.diasMaximo) return false;
      }
      if (
        filtros.precioMinimo > 0 &&
        Number(o.contrato?.precio_max ?? 0) < filtros.precioMinimo
      )
        return false;
      return true;
    });

    filtradas.sort((a, b) => {
      if (orden === "urgencia") {
        const da = a.fecha_limite_propuestas
          ? new Date(a.fecha_limite_propuestas).getTime()
          : Infinity;
        const db = b.fecha_limite_propuestas
          ? new Date(b.fecha_limite_propuestas).getTime()
          : Infinity;
        return da - db;
      }
      if (orden === "precio-asc")
        return Number(a.contrato?.precio_min ?? 0) - Number(b.contrato?.precio_min ?? 0);
      if (orden === "recientes")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return filtradas;
  }, [ordenes, filtros, orden]);

  const kpiLiqs = liquidaciones.reduce(
    (acc: { total: number; pendiente: number; pagado: number; pendCount: number }, l: any) => {
      const neto = Number(l.monto_neto) || 0;
      if (l.estado !== "cancelada") acc.total += neto;
      if (l.estado === "pendiente") {
        acc.pendiente += neto;
        acc.pendCount += 1;
      }
      if (l.estado === "pagada") acc.pagado += neto;
      return acc;
    },
    { total: 0, pendiente: 0, pagado: 0, pendCount: 0 }
  );

  const numFiltrosActivos = contarFiltrosActivos(filtros);

  const renderListado = () => {
    if (loadingOrdenes) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      );
    }
    if ((ordenes as any[]).length === 0) {
      return (
        <EmptyState
          icon={Briefcase}
          titulo="No hay órdenes disponibles"
          descripcion="Cuando se publiquen nuevas órdenes que coincidan con tu perfil, las verás aquí."
        />
      );
    }
    if (ordenesFiltradasYOrdenadas.length === 0) {
      return (
        <EmptyState
          icon={Briefcase}
          titulo="No hay órdenes que coincidan con tus filtros"
          descripcion="Ajusta los filtros o vuelve más tarde para ver nuevas órdenes."
          action={
            <Button size="sm" variant="outline" onClick={() => setFiltros(defaultFiltrosOrdenes)}>
              Limpiar filtros
            </Button>
          }
        />
      );
    }
    if (vista === "grid") {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ordenesFiltradasYOrdenadas.map((o: any) => (
            <OrdenDisponibleCard
              key={o.id}
              orden={o}
              onPostular={setPostularOrden}
              onIrAMisPropuestas={() => setTab("mis-propuestas")}
            />
          ))}
        </div>
      );
    }
    return (
      <OrdenesListaCompacta
        ordenes={ordenesFiltradasYOrdenadas}
        onPostular={setPostularOrden}
        onIrAMisPropuestas={() => setTab("mis-propuestas")}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Hola, {nombre}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tienes {resumenExperto?.ordenes_activas ?? 0} órdenes activas
            {resumenExperto?.propuestas_pendientes
              ? ` y ${resumenExperto.propuestas_pendientes} propuestas pendientes por revisar`
              : ""}
            .
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricaOverview
            label="Órdenes abiertas"
            value={resumenExperto?.ordenes_activas ?? 0}
            icon={Inbox}
            sublabel="Disponibles para postular"
          />
          <MetricaOverview
            label="Propuestas pendientes"
            value={resumenExperto?.propuestas_pendientes ?? 0}
            icon={Send}
            sublabel="En evaluación"
          />
          <MetricaOverview
            label="Tasa adjudicación"
            value={
              resumenExperto?.tasa_adjudicacion_pct != null
                ? `${resumenExperto.tasa_adjudicacion_pct}%`
                : "—"
            }
            icon={Trophy}
            sublabel={`${resumenExperto?.propuestas_ganadas ?? 0} ganadas`}
          />
          <MetricaOverview
            label="Ingresos del mes"
            value={formatCOPCompact(resumenExperto?.ingresos_mes ?? 0)}
            icon={Coins}
            sublabel="Liquidaciones pagadas"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="disponibles">
              Órdenes disponibles
              {(ordenes as any[]).length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {(ordenes as any[]).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mis-propuestas">
              Mis propuestas
              {propuestas.length > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {propuestas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mi-desempeno">Mi desempeño</TabsTrigger>
            <TabsTrigger value="mis-pagos">
              Mis pagos
              {kpiLiqs.pendCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">
                  {kpiLiqs.pendCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disponibles" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
              <div className="hidden lg:block">
                <FiltrosOrdenesSticky
                  filtros={filtros}
                  onChange={setFiltros}
                  tiposDisponibles={tiposDisponibles}
                />
              </div>
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros{numFiltrosActivos > 0 ? ` (${numFiltrosActivos})` : ""}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <div className="mt-6">
                      <FiltrosOrdenesSticky
                        filtros={filtros}
                        onChange={setFiltros}
                        tiposDisponibles={tiposDisponibles}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div>
                <HeaderResultadosOrdenes
                  total={ordenesFiltradasYOrdenadas.length}
                  filtros={filtros}
                  setFiltros={setFiltros}
                  orden={orden}
                  onOrdenChange={setOrden}
                  vista={vista}
                  onVistaChange={setVista}
                  tiposDisponibles={tiposDisponibles}
                />
                {renderListado()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mis-propuestas" className="mt-4">
            {loadingProps ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : propuestas.length === 0 ? (
              <EmptyState
                icon={FileText}
                titulo="Aún no has enviado propuestas"
                descripcion="Cuando postules a una orden disponible, tus propuestas aparecerán aquí."
              />
            ) : (
              <div className="space-y-3">
                {propuestas.map((p: any) => (
                  <PropuestaItem key={p.id} propuesta={p} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mi-desempeno" className="mt-4">
            <MiDesempenoPanel />
          </TabsContent>

          <TabsContent value="mis-pagos" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total ganado (neto)</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">
                    {formatCOP(kpiLiqs.total)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
                  <p className="text-2xl font-semibold text-amber-600 dark:text-amber-500 mt-1">
                    {formatCOP(kpiLiqs.pendiente)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Ya cobrado</p>
                  <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-500 mt-1">
                    {formatCOP(kpiLiqs.pagado)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {loadingLiqs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : liquidaciones.length === 0 ? (
              <EmptyState
                icon={Wallet}
                titulo="Aún no tienes liquidaciones"
                descripcion="Se generan automáticamente cuando completas un análisis adjudicado."
              />
            ) : (
              <div className="space-y-3">
                {liquidaciones.map((l: any) => (
                  <LiquidacionItem key={l.id} liq={l} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {postularOrden && (
        <PostularmeDialog
          open={!!postularOrden}
          onOpenChange={(v) => !v && setPostularOrden(null)}
          orden={postularOrden}
        />
      )}
    </DashboardLayout>
  );
};

export default DashboardMisOrdenes;
