import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { usePermisosAcciones } from "@/hooks/usePermisosAcciones";

type Notif = {
  id: string;
  mensaje: string | null;
  leida: boolean | null;
  created_at: string;
  tipo: string | null;
  negociacion_id: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

const CampanaNotificacionesPortal = () => {
  const { user } = useAuth();
  const { permite } = usePermisosAcciones();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const { data: lista = [] } = useQuery({
    queryKey: ["notificaciones", user?.id, "portal-ultimas"],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("id, mensaje, leida, created_at, tipo, negociacion_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
  });

  const { data: sinLeer = 0 } = useQuery({
    queryKey: ["unread-notif", user?.id, "portal"],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notificaciones")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("leida", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ["notificaciones"] });
    qc.invalidateQueries({ queryKey: ["unread-notif"] });
  };

  const marcar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refrescar,
  });

  const marcarTodas = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("user_id", user!.id)
        .eq("leida", false);
      if (error) throw error;
    },
    onSuccess: refrescar,
  });

  const pulsar = (n: Notif) => {
    if (!n.leida) marcar.mutate(n.id);
    if (n.tipo === "negociacion" && n.negociacion_id && permite("sala_negociacion")) {
      setAbierto(false);
      navigate(`/negociacion/${n.negociacion_id}`);
    }
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 shrink-0" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {sinLeer > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none text-destructive-foreground">
              {sinLeer > 99 ? "99+" : sinLeer}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[calc(100vw-1.5rem)] max-w-sm p-0 md:w-96">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            disabled={sinLeer === 0 || marcarTodas.isPending}
            onClick={() => marcarTodas.mutate()}
          >
            <CheckCheck className="mr-1 h-4 w-4" /> Marcar todas como leídas
          </Button>
        </div>
        {lista.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aún no tienes notificaciones</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {lista.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <button
                  type="button"
                  onClick={() => pulsar(n)}
                  className="flex w-full min-h-11 items-start gap-3 px-4 py-3 text-left hover:bg-muted"
                >
                  <span
                    aria-label={n.leida ? undefined : "Sin leer"}
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.leida ? "bg-transparent" : "bg-orange"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block break-words text-sm ${n.leida ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                      {n.mensaje}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{fmt(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CampanaNotificacionesPortal;
