import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Briefcase, ChevronDown, Wallet, Inbox, Send, Trophy, Coins } from "lucide-react";
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
import { formatCOPCompact } from "@/lib/format";

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const fmtFecha = (d: string) => new Date(d).toLocaleDateString("es-CO");

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
    ? Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 3600 * 24))
    : null;
  const cerrada = diasRest !== null && diasRest < 0;
  const yaPostulo = tengo && tengo.estado !== "retirada";

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {orden.tipo?.nombre && <Badge variant="secondary">{orden.tipo.nombre}</Badge>}
          <Badge variant={orden.visibilidad === "publica" ? "default" : "outline"}>
            {orden.visibilidad === "publica" ? "Pública" : "Invitación"}
          </Badge>
          {cerrada && <Badge variant="destructive">Cerrada</Badge>}
        </div>

        <div>
          <p className="font-semibold text-foreground">{orden.lote?.nombre_lote ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {orden.lote?.ciudad ?? "—"}
            {orden.lote?.barrio ? ` · ${orden.lote.barrio}` : ""}
          </p>
        </div>

        {fechaLimite && (
          <p className="text-xs">
            Fecha límite: <strong>{fmtFecha(orden.fecha_limite_propuestas)}</strong>
            {diasRest !== null && (
              <span className={`ml-2 ${diasRest <= 2 ? "text-destructive" : "text-muted-foreground"}`}>
                ({diasRest > 0 ? `Vence en ${diasRest} días` : "vencida"})
              </span>
            )}
          </p>
        )}

        {orden.contrato && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>
              Precio: <strong>{fmtCOP(Number(orden.contrato.precio_min))}</strong> –{" "}
              <strong>{fmtCOP(Number(orden.contrato.precio_max))}</strong>
            </p>
            <p>
              Plazo: <strong>{orden.contrato.plazo_min_dias}</strong> –{" "}
              <strong>{orden.contrato.plazo_max_dias}</strong> días
            </p>
          </div>
        )}

        <div className="pt-2">
          {yaPostulo ? (
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">Ya postulaste</Badge>
              <Button size="sm" variant="outline" onClick={onIrAMisPropuestas}>
                Ver mi propuesta
              </Button>
            </div>
          ) : cerrada ? (
            <Button size="sm" disabled className="w-full">
              Cerrada
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={() => onPostular(orden)}>
              Postularme
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
            <strong>{fmtCOP(Number(propuesta.precio_propuesto))}</strong>
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
                <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${openMsg ? "rotate-180" : ""}`} />
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
            <span>{fmtCOP(Number(liq.monto_bruto))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Fee 360Lateral ({Number(liq.fee_pct)}%)</span>
            <span>−{fmtCOP(Number(liq.fee_monto))}</span>
          </div>
          <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-emerald-700 dark:text-emerald-500">
            <span>Recibes</span>
            <span>{fmtCOP(Number(liq.monto_neto))}</span>
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
              {ordenes.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/15 px-1.5 text-xs">
                  {ordenes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mis-propuestas">
              Mis propuestas
              {propuestas.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/15 px-1.5 text-xs">
                  {propuestas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="mi-desempeno">Mi desempeño</TabsTrigger>
            <TabsTrigger value="mis-pagos">
              Mis pagos
              {kpiLiqs.pendCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 text-xs">
                  {kpiLiqs.pendCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disponibles" className="mt-4">
            {loadingOrdenes ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            ) : ordenes.length === 0 ? (
              <Card>
                <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
                  <Briefcase className="h-10 w-10" />
                  <p>No hay órdenes disponibles en este momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ordenes.map((o: any) => (
                  <OrdenDisponibleCard
                    key={o.id}
                    orden={o}
                    onPostular={setPostularOrden}
                    onIrAMisPropuestas={() => setTab("mis-propuestas")}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mis-propuestas" className="mt-4">
            {loadingProps ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : propuestas.length === 0 ? (
              <Card>
                <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
                  <Briefcase className="h-10 w-10" />
                  <p>Aún no has enviado propuestas.</p>
                </CardContent>
              </Card>
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
                    {fmtCOP(kpiLiqs.total)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
                  <p className="text-2xl font-semibold text-amber-600 dark:text-amber-500 mt-1">
                    {fmtCOP(kpiLiqs.pendiente)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Ya cobrado</p>
                  <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-500 mt-1">
                    {fmtCOP(kpiLiqs.pagado)}
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
              <Card>
                <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
                  <Wallet className="h-10 w-10" />
                  <p>
                    Aún no tienes liquidaciones. Se generan automáticamente cuando
                    completas un análisis adjudicado.
                  </p>
                </CardContent>
              </Card>
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
