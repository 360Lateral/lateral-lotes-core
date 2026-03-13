import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const estadoVariant = (e: string) => {
  switch (e) {
    case "Disponible": return "disponible" as const;
    case "Reservado": return "reservado" as const;
    case "Vendido": return "vendido" as const;
    default: return "default" as const;
  }
};

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

  const totalLotes = lotes.length;
  const disponibles = lotes.filter((l) => l.estado_disponibilidad === "Disponible").length;
  const reservados = lotes.filter((l) => l.estado_disponibilidad === "Reservado").length;
  const vendidos = lotes.filter((l) => l.estado_disponibilidad === "Vendido").length;

  const today = new Date().toISOString().split("T")[0];
  const leadsHoy = leads.filter((l) => l.created_at.startsWith(today)).length;

  const metrics = [
    { label: "Total lotes", value: totalLotes, icon: MapPin, color: "text-secondary" },
    { label: "Disponibles", value: disponibles, icon: CheckCircle, color: "text-success" },
    { label: "Reservados", value: reservados, icon: Clock, color: "text-warning" },
    { label: "Leads nuevos hoy", value: leadsHoy, icon: Users, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <h1 className="mb-6 font-body text-xl font-bold text-foreground">Dashboard</h1>

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
