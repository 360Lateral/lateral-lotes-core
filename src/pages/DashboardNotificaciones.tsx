import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardNotificaciones = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ["notificaciones", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*, lotes(nombre_lote)")
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
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const unreadCount = notificaciones.filter((n: any) => !n.leida).length;

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-foreground">Notificaciones</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">No tienes notificaciones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n: any) => (
            <Card key={n.id} className={n.leida ? "opacity-60" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.leida && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <p className="font-body text-sm font-medium text-foreground">
                      {n.mensaje}
                    </p>
                  </div>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!n.leida && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead.mutate(n.id)}
                      title="Marcar como leída"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="default" size="sm" asChild>
                    <Link to={`/lotes/${n.lote_id}`}>
                      <Eye className="mr-1 h-4 w-4" />
                      Ver lote
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardNotificaciones;
