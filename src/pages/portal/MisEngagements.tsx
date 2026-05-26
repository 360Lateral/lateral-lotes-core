import { useNavigate } from "react-router-dom";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import PortalProtectedRoute from "@/components/portal/PortalProtectedRoute";
import {
  useMisEngagementsCliente,
  EngagementClienteResumen,
} from "@/hooks/cliente/useMisEngagementsCliente";
import { useMisActivos } from "@/hooks/useMisActivos";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MisActivosTab from "@/components/portal/MisActivosTab";
import {
  Folder,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

const planVariant = (codigo?: string | null): {
  variant: "default" | "secondary" | "outline" | "destructive";
  className?: string;
} => {
  const c = (codigo || "").toLowerCase();
  if (c.includes("premium")) return { variant: "default", className: "bg-amber-500 hover:bg-amber-600 text-white" };
  if (c.includes("pro")) return { variant: "default" };
  if (c.includes("basico") || c.includes("básico")) return { variant: "secondary" };
  return { variant: "outline" };
};

const formatoFecha = (fecha: string | null) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SlaPildora = ({ e }: { e: EngagementClienteResumen }) => {
  if (e.estado === "entregado") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Entregado</Badge>;
  }
  const dias = e.dias_para_sla;
  if (dias === null || dias === undefined) {
    return <Badge variant="outline">Sin fecha estimada</Badge>;
  }
  if (dias < 0) {
    return <Badge variant="destructive">Entrega atrasada</Badge>;
  }
  if (dias <= 7) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
        Próxima entrega en {dias} {dias === 1 ? "día" : "días"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Calendar className="h-3 w-3" />
      Entrega estimada: {formatoFecha(e.fecha_sla)}
    </Badge>
  );
};

const ChipMaestro = ({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) => {
  if (ready) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {label} · Pendiente
    </span>
  );
};

const EngagementCard = ({ e, onClick }: { e: EngagementClienteResumen; onClick: () => void }) => {
  const plan = planVariant(e.plan_codigo);
  const ambosListos = e.tiene_diagnostico && e.tiene_presentacion;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
    >
      <Card className="overflow-hidden">
        {ambosListos && (
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Sparkles className="h-4 w-4" />
            Tu Diagnóstico está listo · Haz clic para abrirlo
          </div>
        )}
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {e.lote_nombre || "Lote sin nombre"}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {[e.lote_direccion, e.lote_ciudad].filter(Boolean).join(", ") || "Ubicación no disponible"}
                </span>
              </p>
            </div>
            {e.plan_nombre && (
              <Badge variant={plan.variant} className={plan.className}>
                {e.plan_nombre}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avance</span>
              <span className="font-medium">{Math.round(e.avance_pct ?? 0)}%</span>
            </div>
            <Progress value={e.avance_pct ?? 0} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{e.estado.replace(/_/g, " ")}</Badge>
            <SlaPildora e={e} />
          </div>

          <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
            <ChipMaestro label="Diagnóstico" ready={e.tiene_diagnostico} />
            <ChipMaestro label="Presentación" ready={e.tiene_presentacion} />
          </div>
        </CardContent>
      </Card>
    </button>
  );
};

const ServiciosList = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useMisEngagementsCliente();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-4">
          <Folder className="h-16 w-16 text-muted-foreground/40" />
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-semibold">Aún no tienes diagnósticos contratados.</h3>
            <p className="text-sm text-muted-foreground">
              Si crees que esto es un error, contacta a tu asesor.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {data.map((e) => (
        <EngagementCard
          key={e.engagement_id}
          e={e}
          onClick={() => navigate(`/portal/engagement/${e.engagement_id}`)}
        />
      ))}
    </div>
  );
};

const PortalHomeInner = () => {
  const { user } = useAuth();
  const { data: engagements } = useMisEngagementsCliente();
  const { data: activos = [] } = useMisActivos(user?.id);

  const nombre =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.nombre as string) ||
    user?.email?.split("@")[0] ||
    "Cliente";

  const serviciosCount = (engagements ?? []).filter(
    (e) => e.estado !== "cancelado" && e.estado !== "cerrado"
  ).length;
  const activosPublicadosCount = activos.filter(
    (a) => a.estado_publicacion === "aprobado"
  ).length;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Hola, {nombre}.
        </h1>
        <p className="text-muted-foreground text-sm">
          Aquí encuentras tus servicios contratados y los activos que tienes
          publicados en el mercado.
        </p>
      </header>

      <Tabs defaultValue="servicios" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xl">
          <TabsTrigger value="servicios" className="gap-2">
            <span className="truncate">Mis servicios contratados</span>
            {serviciosCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {serviciosCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activos" className="gap-2">
            <span className="truncate">Mis activos en venta</span>
            {activosPublicadosCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {activosPublicadosCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicios" className="mt-6">
          <ServiciosList />
        </TabsContent>
        <TabsContent value="activos" className="mt-6">
          <MisActivosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MisEngagements = () => (
  <PortalProtectedRoute>
    <PortalClienteLayout>
      <PortalHomeInner />
    </PortalClienteLayout>
  </PortalProtectedRoute>
);

export default MisEngagements;
