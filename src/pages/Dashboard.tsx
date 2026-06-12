import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ClipboardCheck,
  CreditCard,
  Download,
  MessageCircle,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLotesPendientesValidacion } from "@/hooks/useLotesPendientesValidacion";
import { useSolicitudesContacto } from "@/hooks/useSolicitudesContacto";
import { useToast } from "@/hooks/use-toast";
import { formatCOPCompact, formatoRelativo } from "@/lib/format";

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

interface KPIAdminProps {
  label: string;
  value: string | number;
  deltaLabel?: string;
  deltaPositive?: boolean;
  sublabel?: string;
}

const KPIAdmin = ({ label, value, deltaLabel, deltaPositive, sublabel }: KPIAdminProps) => (
  <div className="rounded-md bg-muted/40 p-3">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 flex items-baseline justify-between gap-2">
      <span className="text-xl font-bold text-foreground">{value}</span>
      {deltaLabel && (
        <span className={`text-[10px] ${deltaPositive ? "text-emerald-600" : "text-muted-foreground"}`}>
          {deltaPositive && <ArrowUp className="inline h-2.5 w-2.5" />}
          {deltaLabel}
        </span>
      )}
      {sublabel && !deltaLabel && (
        <span className="text-[10px] text-muted-foreground">{sublabel}</span>
      )}
    </div>
  </div>
);

interface AccionUrgenteProps {
  icon: LucideIcon;
  titulo: string;
  count: number;
  countLabel: string;
  onClick: () => void;
}

const AccionUrgente = ({ icon: Icon, titulo, count, countLabel, onClick }: AccionUrgenteProps) => (
  <button
    onClick={onClick}
    disabled={count === 0}
    className="text-left rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
      <Icon className="h-3.5 w-3.5" />
      {titulo}
    </div>
    <div className="mt-0.5 text-[11px] text-muted-foreground">{countLabel}</div>
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
  const firstName = displayName.split(" ")[0];

  // Lotes totales
  const { data: lotes = [] } = useQuery({
    queryKey: ["dash-lotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("id, created_at, estado_disponibilidad");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Leads recientes
  const { data: leads = [] } = useQuery({
    queryKey: ["dash-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, created_at, nombre, email, estado, lote_id, lotes(nombre_lote)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Negociaciones activas
  const { data: negociaciones = [] } = useQuery({
    queryKey: ["dash-neg-activas-count"],
    queryFn: async () => {
      const { data } = await supabase
        .from("negociaciones")
        .select("id, estado")
        .eq("estado", "activa");
      return data ?? [];
    },
  });

  // Usuarios
  const { data: usuariosData = { total: 0, nuevos: 0 } } = useQuery({
    queryKey: ["dash-usuarios"],
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 30);
      const [totalRes, nuevosRes] = await Promise.all([
        supabase.from("perfiles").select("id", { count: "exact", head: true }),
        supabase
          .from("perfiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", desde.toISOString()),
      ]);
      return {
        total: totalRes.count ?? 0,
        nuevos: nuevosRes.count ?? 0,
      };
    },
  });

  // Ingresos del mes (transacciones aprobadas)
  const { data: ingresosMes = { actual: 0, anterior: 0 } } = useQuery({
    queryKey: ["dash-ingresos-mes"],
    queryFn: async () => {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const inicioMesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const finMesAnt = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

      const [actRes, antRes] = await Promise.all([
        (supabase as any)
          .from("transacciones")
          .select("monto_cop")
          .eq("estado", "aprobada")
          .gte("fecha_aprobacion", inicioMes.toISOString()),
        (supabase as any)
          .from("transacciones")
          .select("monto_cop")
          .eq("estado", "aprobada")
          .gte("fecha_aprobacion", inicioMesAnt.toISOString())
          .lte("fecha_aprobacion", finMesAnt.toISOString()),
      ]);
      const sum = (rows: any[] | null | undefined) =>
        (rows ?? []).reduce((s, r) => s + Number(r.monto_cop ?? 0), 0);
      return { actual: sum(actRes.data), anterior: sum(antRes.data) };
    },
  });

  // Hooks compartidos con sidebar para badges urgentes
  const { data: lotesPendientes = [] } = useLotesPendientesValidacion();
  const { data: solicitudesPendientes = [] } = useSolicitudesContacto("pendiente");
  const { data: pagosPendientes = [] } = useQuery({
    queryKey: ["dash-pagos-pendientes"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("transacciones")
        .select("id")
        .eq("estado", "pendiente");
      return data ?? [];
    },
  });

  // Actividad reciente últimas 24h
  const { data: actividad = [] } = useQuery({
    queryKey: ["dash-actividad-24h"],
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 1);
      const desdeIso = desde.toISOString();
      const [nuevosLotes, nuevosLeads, transAp, neg] = await Promise.all([
        supabase
          .from("lotes")
          .select("id, nombre_lote, created_at")
          .gte("created_at", desdeIso)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("leads")
          .select("id, nombre, created_at")
          .gte("created_at", desdeIso)
          .order("created_at", { ascending: false })
          .limit(5),
        (supabase as any)
          .from("transacciones")
          .select("id, monto_cop, fecha_aprobacion")
          .eq("estado", "aprobada")
          .gte("fecha_aprobacion", desdeIso)
          .order("fecha_aprobacion", { ascending: false })
          .limit(5),
        supabase
          .from("negociaciones")
          .select("id, created_at")
          .gte("created_at", desdeIso)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      type Item = { id: string; tipo: string; texto: string; fecha: string };
      const items: Item[] = [];
      (nuevosLotes.data ?? []).forEach((l: any) =>
        items.push({ id: `lote-${l.id}`, tipo: "Lote", texto: `Nuevo lote: ${l.nombre_lote ?? "—"}`, fecha: l.created_at })
      );
      (nuevosLeads.data ?? []).forEach((l: any) =>
        items.push({ id: `lead-${l.id}`, tipo: "Lead", texto: `Nuevo lead: ${l.nombre ?? "—"}`, fecha: l.created_at })
      );
      ((transAp.data as any[]) ?? []).forEach((t: any) =>
        items.push({
          id: `tx-${t.id}`,
          tipo: "Pago",
          texto: `Pago aprobado: ${formatCOPCompact(Number(t.monto_cop ?? 0))}`,
          fecha: t.fecha_aprobacion,
        })
      );
      (neg.data ?? []).forEach((n: any) =>
        items.push({ id: `neg-${n.id}`, tipo: "Negociación", texto: `Nueva negociación`, fecha: n.created_at })
      );
      return items
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 8);
    },
  });

  const lotesPendientesCount = lotesPendientes.length;
  const pagosPendientesCount = pagosPendientes.length;
  const solicitudesCount = solicitudesPendientes.length;

  // Lotes nuevos este mes
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const lotesNuevosEsteMes = lotes.filter(
    (l: any) => l.created_at && new Date(l.created_at) >= inicioMes
  ).length;

  const ingresosDelta =
    ingresosMes.anterior > 0
      ? Math.round(((ingresosMes.actual - ingresosMes.anterior) / ingresosMes.anterior) * 100)
      : null;

  const tieneAccionesUrgentes =
    lotesPendientesCount + pagosPendientesCount + solicitudesCount > 0;

  const handleExportar = () => {
    toast({ title: "Exportar", description: "Próximamente disponible." });
  };

  const tipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Pago": return "bg-emerald-100 text-emerald-700";
      case "Lote": return "bg-primary/15 text-primary";
      case "Lead": return "bg-blue-100 text-blue-700";
      case "Negociación": return "bg-purple-100 text-purple-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hola {firstName},{" "}
            {lotesPendientesCount > 0 || pagosPendientesCount > 0 ? (
              <>
                tienes{" "}
                <strong className="text-foreground">
                  {lotesPendientesCount} {lotesPendientesCount === 1 ? "lote" : "lotes"} por validar
                </strong>
                {pagosPendientesCount > 0 && (
                  <>
                    {" "}y{" "}
                    <strong className="text-foreground">
                      {pagosPendientesCount} {pagosPendientesCount === 1 ? "pago pendiente" : "pagos pendientes"}
                    </strong>{" "}
                    de revisión
                  </>
                )}
                .
              </>
            ) : (
              <>no hay acciones urgentes por ahora.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportar}>
            <Download className="mr-1.5 h-4 w-4" /> Exportar
          </Button>
          <Button size="sm" onClick={() => navigate("/dashboard/lotes/nuevo")}>
            <Plus className="mr-1.5 h-4 w-4" /> Nuevo lote
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <section className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <KPIAdmin
          label="Lotes totales"
          value={lotes.length}
          deltaLabel={lotesNuevosEsteMes > 0 ? `+${lotesNuevosEsteMes} este mes` : undefined}
          deltaPositive={lotesNuevosEsteMes > 0}
        />
        <KPIAdmin
          label="Usuarios"
          value={usuariosData.total}
          deltaLabel={usuariosData.nuevos > 0 ? `+${usuariosData.nuevos} nuevos` : undefined}
          deltaPositive={usuariosData.nuevos > 0}
        />
        <KPIAdmin
          label="Negociaciones"
          value={negociaciones.length}
          sublabel="en curso"
        />
        <KPIAdmin
          label="Ingresos del mes"
          value={formatCOPCompact(ingresosMes.actual)}
          deltaLabel={ingresosDelta != null ? `${ingresosDelta > 0 ? "+" : ""}${ingresosDelta}%` : undefined}
          deltaPositive={ingresosDelta != null && ingresosDelta > 0}
        />
      </section>

      {/* Banner acciones urgentes */}
      {tieneAccionesUrgentes && (
        <section
          className="mb-4 rounded-md border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/[0.04] p-3"
          style={{ borderLeftWidth: 3, borderLeftColor: "hsl(var(--primary))" }}
        >
          <h2 className="mb-2 text-xs font-semibold text-foreground">Acciones urgentes</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <AccionUrgente
              icon={ClipboardCheck}
              titulo="Validar lotes"
              count={lotesPendientesCount}
              countLabel={
                lotesPendientesCount === 0
                  ? "Sin pendientes"
                  : `${lotesPendientesCount} ${lotesPendientesCount === 1 ? "pendiente" : "pendientes"}`
              }
              onClick={() => navigate("/dashboard/lotes/pendientes-validacion")}
            />
            <AccionUrgente
              icon={CreditCard}
              titulo="Revisar pagos"
              count={pagosPendientesCount}
              countLabel={
                pagosPendientesCount === 0
                  ? "Sin pendientes"
                  : `${pagosPendientesCount} ${pagosPendientesCount === 1 ? "transacción" : "transacciones"}`
              }
              onClick={() => navigate("/dashboard/pagos")}
            />
            <AccionUrgente
              icon={MessageCircle}
              titulo="Atender solicitudes"
              count={solicitudesCount}
              countLabel={
                solicitudesCount === 0 ? "Sin pendientes" : `${solicitudesCount} sin asignar`
              }
              onClick={() => navigate("/dashboard/solicitudes-contacto")}
            />
          </div>
        </section>
      )}

      {/* Layout inferior 2 columnas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Leads recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold">Leads recientes</CardTitle>
            <Link to="/dashboard/leads" className="text-[10px] text-primary hover:underline">
              Ver todos →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {leads.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin leads recientes.</p>
            ) : (
              leads.map((l: any) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{l.nombre ?? "—"}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {l.lotes?.nombre_lote ?? "Sin lote"} · {formatoRelativo(l.created_at)}
                    </p>
                  </div>
                  <Badge variant={leadEstadoVariant(l.estado)} className="text-[9px]">
                    {l.estado}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actividad de la plataforma */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold">Actividad de la plataforma</CardTitle>
            <span className="text-[10px] text-muted-foreground">Últimas 24h</span>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {actividad.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin actividad en las últimas 24h.</p>
            ) : (
              actividad.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${tipoBadgeColor(a.tipo)}`}>
                    {a.tipo}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{a.texto}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatoRelativo(a.fecha)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
