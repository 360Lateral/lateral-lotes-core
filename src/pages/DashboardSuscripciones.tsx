import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useSuscripcionesAdmin } from "@/hooks/useSuscripcionesAdmin";
import { useAccesosAdmin } from "@/hooks/useAccesosAdmin";
import { CalendarClock, CreditCard, KeyRound, Users } from "lucide-react";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const formatDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const estadoBadge = (e: string) => {
  const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    activa: "default",
    vencida: "secondary",
    pendiente_pago: "outline",
    cancelada: "destructive",
  };
  return <Badge variant={variants[e] ?? "outline"}>{e.replace("_", " ")}</Badge>;
};

const DashboardSuscripciones = () => {
  const { data: subs, isLoading: loadingSubs } = useSuscripcionesAdmin();
  const { data: accesos, isLoading: loadingAcc } = useAccesosAdmin();
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroAcc, setFiltroAcc] = useState<string>("todos");

  const ahora = new Date();
  const en7Dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const kpis = useMemo(() => {
    const activas = (subs ?? []).filter(
      (s) => s.estado === "activa" && s.fecha_fin && new Date(s.fecha_fin) > ahora,
    );
    const ingreso = activas.reduce((acc, s) => acc + (s.precio_cop ?? 0), 0);
    const accActivos = (accesos ?? []).filter(
      (a) => a.estado === "activa" && a.fecha_expiracion && new Date(a.fecha_expiracion) > ahora,
    );
    const porVencer = activas.filter(
      (s) => s.fecha_fin && new Date(s.fecha_fin) <= en7Dias,
    );
    return {
      activas: activas.length,
      ingreso,
      accActivos: accActivos.length,
      porVencer: porVencer.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subs, accesos]);

  const subsFiltradas = (subs ?? []).filter((s) =>
    filtroEstado === "todos" ? true : s.estado === filtroEstado,
  );
  const accFiltrados = (accesos ?? []).filter((a) =>
    filtroAcc === "todos" ? true : a.estado === filtroAcc,
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Suscripciones y accesos</h1>
        </header>
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={<Users className="h-4 w-4" />} label="Suscripciones activas" value={kpis.activas} />
          <KpiCard
            icon={<CreditCard className="h-4 w-4" />}
            label="Ingreso suscripciones"
            value={formatCOP(kpis.ingreso)}
          />
          <KpiCard icon={<KeyRound className="h-4 w-4" />} label="Accesos pay-per-view" value={kpis.accActivos} />
          <KpiCard
            icon={<CalendarClock className="h-4 w-4" />}
            label="Por vencer (7 días)"
            value={kpis.porVencer}
            highlight={kpis.porVencer > 0}
          />
        </div>

        <Tabs defaultValue="suscripciones">
          <TabsList>
            <TabsTrigger value="suscripciones">Suscripciones</TabsTrigger>
            <TabsTrigger value="accesos">Accesos pay-per-view</TabsTrigger>
          </TabsList>

          <TabsContent value="suscripciones" className="space-y-3">
            <div className="flex justify-end">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activas</SelectItem>
                  <SelectItem value="pendiente_pago">Pendientes de pago</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="p-0 overflow-x-auto">
              {loadingSubs ? (
                <Skeleton className="h-64 w-full" />
              ) : subsFiltradas.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">Sin suscripciones para mostrar.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="py-2 px-3">Desarrollador</th>
                      <th className="py-2 px-3">Nivel</th>
                      <th className="py-2 px-3">Periodo</th>
                      <th className="py-2 px-3">Precio</th>
                      <th className="py-2 px-3">Inicio</th>
                      <th className="py-2 px-3">Vence</th>
                      <th className="py-2 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsFiltradas.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="py-2 px-3">
                          <div className="font-medium">{s.desarrollador?.nombre ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{s.desarrollador?.email ?? ""}</div>
                        </td>
                        <td className="py-2 px-3 capitalize">{s.nivel}</td>
                        <td className="py-2 px-3">{s.periodo_meses} m</td>
                        <td className="py-2 px-3">{formatCOP(s.precio_cop)}</td>
                        <td className="py-2 px-3">{formatDate(s.fecha_inicio)}</td>
                        <td className="py-2 px-3">{formatDate(s.fecha_fin)}</td>
                        <td className="py-2 px-3">{estadoBadge(s.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="accesos" className="space-y-3">
            <div className="flex justify-end">
              <Select value={filtroAcc} onValueChange={setFiltroAcc}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activa">Activos</SelectItem>
                  <SelectItem value="pendiente_pago">Pendientes</SelectItem>
                  <SelectItem value="vencida">Vencidos</SelectItem>
                  <SelectItem value="cancelada">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="p-0 overflow-x-auto">
              {loadingAcc ? (
                <Skeleton className="h-64 w-full" />
              ) : accFiltrados.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">Sin accesos para mostrar.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="py-2 px-3">Desarrollador</th>
                      <th className="py-2 px-3">Lote</th>
                      <th className="py-2 px-3">Precio</th>
                      <th className="py-2 px-3">Comprado</th>
                      <th className="py-2 px-3">Expira</th>
                      <th className="py-2 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accFiltrados.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="py-2 px-3">
                          <div className="font-medium">{a.desarrollador?.nombre ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{a.desarrollador?.email ?? ""}</div>
                        </td>
                        <td className="py-2 px-3">
                          <Link to={`/lotes/${a.lote_id}`} className="text-primary hover:underline">
                            {a.lote?.nombre_lote ?? `${a.lote_id.slice(0, 8)}…`}
                          </Link>
                          {a.lote?.ciudad && (
                            <div className="text-xs text-muted-foreground">{a.lote.ciudad}</div>
                          )}
                        </td>
                        <td className="py-2 px-3">{formatCOP(a.precio_cop)}</td>
                        <td className="py-2 px-3">{formatDate(a.fecha_compra)}</td>
                        <td className="py-2 px-3">{formatDate(a.fecha_expiracion)}</td>
                        <td className="py-2 px-3">{estadoBadge(a.estado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const KpiCard = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <Card className={`p-4 ${highlight ? "border-primary" : ""}`}>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {icon}
      {label}
    </div>
    <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
  </Card>
);

export default DashboardSuscripciones;
