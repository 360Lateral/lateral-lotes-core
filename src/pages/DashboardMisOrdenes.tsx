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
import { Briefcase, ChevronDown } from "lucide-react";
import { useMisOrdenesExperto } from "@/hooks/useMisOrdenesExperto";
import { useMisPropuestas } from "@/hooks/useMisPropuestas";
import { useTengoPropuestaEnOrden } from "@/hooks/useTengoPropuestaEnOrden";
import { useRetirarPropuesta } from "@/hooks/useRetirarPropuesta";
import PostularmeDialog from "@/components/ordenes/PostularmeDialog";

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

const DashboardMisOrdenes = () => {
  const [tab, setTab] = useState("disponibles");
  const [postularOrden, setPostularOrden] = useState<any | null>(null);
  const { data: ordenes = [], isLoading: loadingOrdenes } = useMisOrdenesExperto();
  const { data: propuestas = [], isLoading: loadingProps } = useMisPropuestas();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Mis órdenes y propuestas
          </h1>
          <p className="text-sm text-muted-foreground">
            Postúlate a órdenes abiertas y monitorea el estado de tus propuestas.
          </p>
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
