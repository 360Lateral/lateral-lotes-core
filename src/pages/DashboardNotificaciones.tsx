import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, CheckCheck, Eye, Target, Building2,
  TrendingUp, Info, Filter,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Tipos ────────────────────────────────────────────────────────────────
type TipoNotif = "todas" | "match_lote" | "cambio_estado" | "negociacion" | "sistema";

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  match_lote:    { label: "Coincidencia",  icon: Target,     color: "text-primary"       },
  lote_destacado:{ label: "Destacado",     icon: Building2,  color: "text-amber-500"     },
  cambio_estado: { label: "Estado",        icon: TrendingUp, color: "text-blue-500"      },
  negociacion:   { label: "Negociación",   icon: Building2,  color: "text-emerald-500"   },
  sistema:       { label: "Sistema",       icon: Info,       color: "text-muted-foreground" },
};

const ScoreBadge = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Target className="h-3 w-3" />
      {score}%
    </span>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────
const DashboardNotificaciones = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<TipoNotif>("todas");

  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ["notificaciones", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*, lotes(nombre_lote, ciudad, barrio, area_total_m2)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notif"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("user_id", user!.id)
        .eq("leida", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notif"] });
    },
  });

  const filtradas = filtro === "todas"
    ? notificaciones
    : notificaciones.filter((n: any) => n.tipo === filtro);

  const unreadCount = notificaciones.filter((n: any) => !n.leida).length;

  // Conteos por tipo para los filtros
  const conteos: Record<string, number> = {};
  notificaciones.forEach((n: any) => {
    conteos[n.tipo ?? "sistema"] = (conteos[n.tipo ?? "sistema"] ?? 0) + 1;
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-body text-xl font-bold text-foreground">Notificaciones</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} sin leer
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros por tipo */}
      {notificaciones.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setFiltro("todas")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors
              ${filtro === "todas"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}
          >
            <Filter className="h-3 w-3" />
            Todas ({notificaciones.length})
          </button>
          {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => {
            const count = conteos[tipo];
            if (!count) return null;
            const Icon = cfg.icon;
            return (
              <button
                key={tipo}
                onClick={() => setFiltro(tipo as TipoNotif)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors
                  ${filtro === tipo
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-3 w-3" />
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">
            {filtro === "todas"
              ? "No tienes notificaciones aún."
              : `No hay notificaciones de tipo "${TIPO_CONFIG[filtro]?.label ?? filtro}".`}
          </p>
          {filtro === "todas" && (
            <p className="mt-1 font-body text-xs text-muted-foreground">
              Cuando un lote coincida con tus criterios de inversión, aparecerá aquí.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((n: any) => {
            const cfg = TIPO_CONFIG[n.tipo ?? "sistema"] ?? TIPO_CONFIG.sistema;
            const Icon = cfg.icon;
            const lote = n.lotes as any;

            return (
              <Card
                key={n.id}
                className={`transition-opacity ${n.leida ? "opacity-60" : ""}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Indicador no leída */}
                  <div className="shrink-0">
                    {!n.leida
                      ? <span className="flex h-2.5 w-2.5 rounded-full bg-primary" />
                      : <span className="flex h-2.5 w-2.5 rounded-full bg-transparent" />
                    }
                  </div>

                  {/* Icono tipo */}
                  <div className={`shrink-0 ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body text-sm font-medium text-foreground">
                        {n.mensaje}
                      </p>
                      {n.score != null && <ScoreBadge score={n.score} />}
                    </div>

                    {/* Datos del lote */}
                    {lote && (
                      <p className="mt-0.5 font-body text-xs text-muted-foreground">
                        {[lote.barrio, lote.ciudad].filter(Boolean).join(", ")}
                        {lote.area_total_m2 ? ` · ${lote.area_total_m2} m²` : ""}
                      </p>
                    )}

                    <p className="mt-1 font-body text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("es-CO")}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex shrink-0 items-center gap-2">
                    {!n.leida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead.mutate(n.id)}
                        disabled={markAsRead.isPending}
                        title="Marcar como leída"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/lotes/${n.lote_id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Ver lote
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardNotificaciones;
