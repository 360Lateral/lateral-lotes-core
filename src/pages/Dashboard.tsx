import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, CheckCircle, Clock, Users, FileSearch, Handshake, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";


const leadEstadoVariant = (e: string) => {
  switch (e) {
    case "nuevo": return "disponible" as const;
    case "contactado": return "reservado" as const;
    case "negociacion": return "default" as const;
    case "cerrado": return "vendido" as const;
    case "descartado": return "secondary" as const;
    default: return "default" as const;
  }
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: lotes = [] } = useQuery({
    queryKey: ["dash-lotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lotes").select("id, estado_disponibilidad");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["dash-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, created_at, nombre, email, estado, lote_id, lotes(nombre_lote)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: diagnosticos = [] } = useQuery({
    queryKey: ["dash-diagnosticos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnosticos")
        .select("id, estado, created_at, nombre, objetivo" as any)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data as any[]) ?? [];
    },
  });

  const { data: negociaciones = [] } = useQuery({
    queryKey: ["dash-negociaciones"],
    queryFn: async () => {
      const { data } = await supabase
        .from("negociaciones")
        .select("id, estado")
        .eq("estado", "activa");
      return data ?? [];
    },
  });


  const { data: lotesPendientes = [] } = useQuery({
    queryKey: ["dash-lotes-pendientes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad, area_total_m2, created_at, owner_id")
        .eq("estado_disponibilidad", "En revisión")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: negociacionesActivas = [] } = useQuery({
    queryKey: ["dash-neg-activas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("negociaciones")
        .select("id, estado, created_at, lotes(nombre_lote)")
        .eq("estado", "activa")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const totalLotes = lotes.length;
  const disponibles = lotes.filter((l) => l.estado_disponibilidad === "Disponible").length;
  const reservados = lotes.filter((l) => l.estado_disponibilidad === "Reservado").length;
  const vendidos = lotes.filter((l) => l.estado_disponibilidad === "Vendido").length;

  const today = new Date().toISOString().split("T")[0];
  const leadsHoy = leads.filter((l) => l.created_at.startsWith(today)).length;
  const diagNuevos = diagnosticos.filter((d: any) => d.estado === "nuevo").length;

  const metrics = [
    { label: "Total lotes", value: totalLotes, icon: MapPin, color: "text-secondary" },
    { label: "Disponibles", value: disponibles, icon: CheckCircle, color: "text-success" },
    { label: "Reservados", value: reservados, icon: Clock, color: "text-warning" },
    { label: "Leads nuevos hoy", value: leadsHoy, icon: Users, color: "text-primary" },
    { label: "Diagnósticos nuevos", value: diagNuevos, icon: FileSearch, color: "text-warning" },
    { label: "Negociaciones activas", value: negociaciones.length, icon: Handshake, color: "text-primary" },
  ];

  const handleAprobar = async (loteId: string) => {
    const { error } = await supabase
      .from("lotes")
      .update({ estado_disponibilidad: "Disponible", es_publico: true } as any)
      .eq("id", loteId);
    if (error) {
      toast({ title: "Error", description: "No se pudo aprobar el lote.", variant: "destructive" });
    } else {
      toast({ title: "Lote aprobado" });
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-pendientes"] });
      queryClient.invalidateQueries({ queryKey: ["dash-lotes"] });
    }
  };

  const handleRechazar = async (loteId: string) => {
    const { error } = await supabase
      .from("lotes")
      .update({ estado_disponibilidad: "En revisión" } as any)
      .eq("id", loteId);
    if (error) {
      toast({ title: "Error", description: "No se pudo rechazar el lote.", variant: "destructive" });
    } else {
      toast({ title: "Lote rechazado" });
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-pendientes"] });
      queryClient.invalidateQueries({ queryKey: ["dash-lotes"] });
    }
  };

  const handleDiagEstado = async (diagId: string, estado: string) => {
    const { error } = await supabase
      .from("diagnosticos")
      .update({ estado } as any)
      .eq("id", diagId);
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["dash-diagnosticos"] });
    }
  };

  return (
    <DashboardLayout>
      <h1 className="mb-6 font-body text-xl font-bold text-foreground">Dashboard</h1>

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <m.icon className={`h-8 w-8 shrink-0 ${m.color}`} />
              <div>
                <p className="font-body text-2xl font-bold text-foreground">{m.value}</p>
                <p className="font-body text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lotes pendientes — compact approve/reject icons */}
      <TooltipProvider>
        {lotesPendientes.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
                Lotes pendientes de aprobación
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2">Lote</th>
                      <th className="pb-2">Ciudad</th>
                      <th className="pb-2">Área</th>
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotesPendientes.map((l: any) => (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="py-2 text-foreground">{l.nombre_lote}</td>
                        <td className="py-2 text-muted-foreground">{l.ciudad ?? "—"}</td>
                        <td className="py-2 text-muted-foreground">
                          {l.area_total_m2 ? `${Number(l.area_total_m2).toLocaleString("es-CO")} m²` : "—"}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString("es-CO")}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleAprobar(l.id)}
                                  className="rounded-md p-1.5 text-success hover:bg-success/10 transition-colors"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Aprobar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleRechazar(l.id)}
                                  className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Rechazar</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </TooltipProvider>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent leads */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
              Últimos leads
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Nombre</th>
                    <th className="pb-2">Lote</th>
                    <th className="pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l: any) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString("es-CO")}
                      </td>
                      <td className="py-2 text-foreground">{l.nombre}</td>
                      <td className="py-2 text-muted-foreground">
                        {l.lotes?.nombre_lote ?? "—"}
                      </td>
                      <td className="py-2">
                        <Badge variant={leadEstadoVariant(l.estado)} className="text-xs">
                          {l.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No hay leads aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Lotes by status */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
              Lotes por estado
            </h2>
            {[
              { label: "Disponible", count: disponibles, color: "bg-success" },
              { label: "Reservado", count: reservados, color: "bg-warning" },
              { label: "Vendido", count: vendidos, color: "bg-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="mb-3">
                <div className="flex items-center justify-between font-body text-sm">
                  <span className="text-foreground">{s.label}</span>
                  <span className="text-muted-foreground">{s.count}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${s.color}`}
                    style={{
                      width: totalLotes > 0 ? `${(s.count / totalLotes) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Diagnósticos recientes — reduced columns */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
              Diagnósticos recientes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Nombre</th>
                    <th className="pb-2">Objetivo</th>
                    <th className="pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnosticos.map((d: any) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString("es-CO")}
                      </td>
                      <td className="py-2 text-foreground">{d.nombre ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{d.objetivo ?? "—"}</td>
                      <td className="py-2">
                        <Select
                          value={d.estado ?? "nuevo"}
                          onValueChange={(val) => handleDiagEstado(d.id, val)}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevo">Nuevo</SelectItem>
                            <SelectItem value="en_proceso">En proceso</SelectItem>
                            <SelectItem value="entregado">Entregado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {diagnosticos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        No hay diagnósticos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Negociaciones activas — clickable rows, no Estado column, no Ver sala button */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
              Negociaciones activas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-2">Lote</th>
                    <th className="pb-2">Fecha inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {negociacionesActivas.map((n: any) => (
                    <tr
                      key={n.id}
                      className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/negociacion/${n.id}`)}
                    >
                      <td className="py-2 text-foreground">
                        {(n.lotes as any)?.nombre_lote ?? "Lote"}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  ))}
                  {negociacionesActivas.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-muted-foreground">
                        No hay negociaciones activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
