import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMisActivos } from "@/hooks/useMisActivos";
import { usePlanesConPrecio, PlanConPrecio } from "@/hooks/usePlanesConPrecio";
import { useAnalisisPorPlan } from "@/hooks/useAnalisisPorPlan";
import { useSolicitarDiagnostico } from "@/hooks/useSolicitarDiagnostico";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, MapPin, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loteIdPreseleccionado?: string;
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const SolicitarDiagnosticoDialog = ({
  open,
  onOpenChange,
  loteIdPreseleccionado,
}: Props) => {
  const { user } = useAuth();
  const { data: activos = [], isLoading: loadingActivos } = useMisActivos(user?.id);
  const { data: planes = [], isLoading: loadingPlanes } = usePlanesConPrecio();
  const { data: analisis = [] } = useAnalisisPorPlan();
  const solicitar = useSolicitarDiagnostico();

  const [loteId, setLoteId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setLoteId(loteIdPreseleccionado ?? "");
      setPlanId("");
    }
  }, [open, loteIdPreseleccionado]);

  const loteSeleccionado = useMemo(
    () => activos.find((a) => a.id === loteId),
    [activos, loteId]
  );
  const planSeleccionado: PlanConPrecio | undefined = useMemo(
    () => planes.find((p) => p.id === planId),
    [planes, planId]
  );

  const analisisPorPlan = useMemo(() => {
    const map: Record<string, { codigo: string; nombre: string }[]> = {};
    for (const a of analisis) {
      (map[a.plan_id] ||= []).push({ codigo: a.codigo, nombre: a.nombre });
    }
    return map;
  }, [analisis]);

  const planesOrdenados = useMemo(
    () => [...planes].sort((a, b) => a.orden - b.orden),
    [planes]
  );

  const sinActivos = !loadingActivos && activos.length === 0;
  const esGratuito = planSeleccionado?.codigo === "gratuito";

  const handleConfirmar = async () => {
    if (!loteSeleccionado || !planSeleccionado) return;
    try {
      const result = await solicitar.mutateAsync({
        lote_id: loteSeleccionado.id,
        plan_id: planSeleccionado.id,
        plan_codigo: planSeleccionado.codigo,
      });
      if (result.es_gratuito) {
        onOpenChange(false);
      } else if (result.payment_url) {
        window.location.href = result.payment_url;
      }
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar diagnóstico</DialogTitle>
          <DialogDescription>
            Elige el lote y el plan que mejor se ajuste a tus necesidades.
          </DialogDescription>
        </DialogHeader>

        {sinActivos ? (
          <div className="py-10 flex flex-col items-center text-center gap-3">
            <PackageOpen className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold">No tienes activos registrados.</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Primero debes publicar un activo en "Mis activos en venta" antes
              de solicitar un diagnóstico.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Paso 1: lote */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">1. Activo a diagnosticar</h3>
              {loteIdPreseleccionado && loteSeleccionado ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {loteSeleccionado.nombre_lote || "(sin nombre)"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[loteSeleccionado.barrio, loteSeleccionado.ciudad]
                        .filter(Boolean)
                        .join(" · ") || "Ubicación no especificada"}
                    </p>
                  </div>
                  <Badge variant="secondary">Para este activo</Badge>
                </div>
              ) : (
                <Select value={loteId} onValueChange={setLoteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona uno de tus activos" />
                  </SelectTrigger>
                  <SelectContent>
                    {activos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nombre_lote || "(sin nombre)"} —{" "}
                        {[a.barrio, a.ciudad].filter(Boolean).join(", ") ||
                          "Ubicación no especificada"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </section>

            {/* Paso 2: plan */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">2. Elige tu plan</h3>
              {loadingPlanes ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {planesOrdenados.map((p) => {
                    const sel = p.id === planId;
                    const items = analisisPorPlan[p.id] ?? [];
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPlanId(p.id)}
                        className={cn(
                          "text-left rounded-lg border p-3 transition-all",
                          "hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring",
                          sel
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold">{p.nombre}</h4>
                          {sel && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-lg font-bold">
                            {p.codigo === "gratuito"
                              ? "Gratis"
                              : fmtCOP(p.precio_cop_actual)}
                          </p>
                          {p.codigo !== "gratuito" && (
                            <p className="text-[11px] text-muted-foreground">
                              {p.precio_smlmv} SMLMV
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega en {p.dias_sla} días
                        </p>
                        <ul className="mt-3 space-y-1">
                          {items.map((it) => (
                            <li
                              key={it.codigo}
                              className="text-xs flex items-start gap-1.5 text-foreground/80"
                            >
                              <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-600 shrink-0" />
                              <span>{it.nombre}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Paso 3: confirmación */}
            {loteSeleccionado && planSeleccionado && (
              <section className="space-y-2 rounded-lg bg-muted/40 border p-4">
                <h3 className="text-sm font-semibold">3. Confirmación</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Activo: </span>
                    <span className="font-medium">
                      {loteSeleccionado.nombre_lote || "(sin nombre)"}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Plan: </span>
                    <span className="font-medium">{planSeleccionado.nombre}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-semibold">
                      {esGratuito
                        ? "Gratis"
                        : fmtCOP(planSeleccionado.precio_cop_actual)}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">SLA: </span>
                    {planSeleccionado.dias_sla} días
                  </p>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  {esGratuito
                    ? "Al confirmar, tu engagement se activará al instante."
                    : "Al confirmar, te redirigiremos al pago seguro de Wompi."}
                </p>
              </section>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={solicitar.isPending}
          >
            Cancelar
          </Button>
          {!sinActivos && (
            <Button
              onClick={handleConfirmar}
              disabled={
                !loteSeleccionado || !planSeleccionado || solicitar.isPending
              }
            >
              {solicitar.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {esGratuito ? "Activar diagnóstico" : "Continuar al pago"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SolicitarDiagnosticoDialog;
