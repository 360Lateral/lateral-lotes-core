import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { formatCOP } from "@/lib/format-moneda";

const TABS: { value: string; label: string }[] = [
  { value: "abierta", label: "Abiertas" },
  { value: "adjudicada", label: "Adjudicadas" },
  { value: "en_ejecucion", label: "En ejecución" },
  { value: "completada", label: "Completadas" },
  { value: "cancelada", label: "Canceladas" },
];

const usePropuestasCount = (ordenId: string) =>
  useQuery({
    queryKey: ["propuestas-count", ordenId],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("propuestas_experto")
        .select("*", { count: "exact", head: true })
        .eq("orden_id", ordenId);
      if (error) return 0;
      return count ?? 0;
    },
  });

const OrdenCard = ({ orden }: { orden: any }) => {
  const { data: count = 0 } = usePropuestasCount(orden.id);
  const fechaLimite = orden.fecha_limite_propuestas ? new Date(orden.fecha_limite_propuestas) : null;
  const diasRest = fechaLimite
    ? Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 3600 * 24))
    : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{orden.estado}</Badge>
          {orden.tipo?.nombre && <Badge variant="secondary">{orden.tipo.nombre}</Badge>}
          <Badge variant={orden.visibilidad === "publica" ? "default" : "outline"}>
            {orden.visibilidad === "publica" ? "Pública" : "Invitación"}
          </Badge>
        </div>
        <div>
          <p className="font-semibold text-foreground">{orden.lote?.nombre_lote ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {orden.lote?.ciudad ?? "—"}
            {orden.lote?.barrio ? ` · ${orden.lote.barrio}` : ""}
          </p>
        </div>
        {orden.contrato && (
          <p className="text-xs text-muted-foreground">
            Contrato v{orden.contrato.version} ·{" "}
            {formatCOP(Number(orden.contrato.precio_min))}–{formatCOP(Number(orden.contrato.precio_max))} ·{" "}
            {orden.contrato.plazo_min_dias}–{orden.contrato.plazo_max_dias} días
          </p>
        )}
        {fechaLimite && (
          <p className="text-xs">
            Fecha límite: <strong>{fechaLimite.toLocaleDateString("es-CO")}</strong>
            {orden.estado === "abierta" && diasRest !== null && (
              <span className={`ml-2 ${diasRest <= 2 ? "text-destructive" : "text-muted-foreground"}`}>
                ({diasRest > 0 ? `${diasRest}d restantes` : "vencida"})
              </span>
            )}
          </p>
        )}
        <p className="text-xs">Propuestas recibidas: <strong>{count}</strong></p>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to={`/dashboard/ordenes-servicio/${orden.id}`}>Ver detalle</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const TabPanel = ({ estado }: { estado: string }) => {
  const { data = [], isLoading } = useOrdenesServicio(estado);
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <ClipboardList className="h-10 w-10" />
          <p>No hay órdenes en estado "{estado}".</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((o: any) => (
        <OrdenCard key={o.id} orden={o} />
      ))}
    </div>
  );
};

const DashboardOrdenesServicio = () => {
  const [tab, setTab] = useState("abierta");

  // Totales por estado
  const { data: counts = {} } = useQuery({
    queryKey: ["ordenes-counts"],
    queryFn: async () => {
      const res: Record<string, number> = {};
      for (const t of TABS) {
        const { count } = await (supabase as any)
          .from("ordenes_servicio")
          .select("*", { count: "exact", head: true })
          .eq("estado", t.value);
        res[t.value] = count ?? 0;
      }
      return res;
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Órdenes de servicio</h1>
          <p className="text-sm text-muted-foreground">
            Solicitudes para que expertos postulen a ejecutar análisis sobre los lotes.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {counts[t.value] > 0 && (
                  <span className="ml-2 rounded-full bg-primary/15 px-1.5 text-xs">{counts[t.value]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-4">
              <TabPanel estado={t.value} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrdenesServicio;
