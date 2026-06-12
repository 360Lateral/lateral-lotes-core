import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { useMarcarLeida } from "@/hooks/useMarcarLeida";
import { useAuth } from "@/contexts/AuthContext";
import type { Notificacion } from "@/hooks/useNotificaciones";

interface Props {
  notificacion: Notificacion;
  onClose: () => void;
}

const NotificacionItem = ({ notificacion: n, onClose }: Props) => {
  const navigate = useNavigate();
  const marcar = useMarcarLeida();
  const { isAdminOrExperto } = useAuth();

  const barColor =
    n.nivel === "rojo"
      ? "bg-destructive"
      : n.nivel === "amarillo"
      ? "bg-amber-500"
      : "bg-muted-foreground";

  const handleClick = () => {
    if (n.estado === "pendiente") marcar.mutate(n.id);
    const data = (n.data ?? {}) as Record<string, unknown>;
    const engagementId = (data.engagement_id as string) ?? n.entidad_id;
    if (n.entidad_tipo === "mensaje_asesor" && engagementId) {
      navigate(
        isAdminOrExperto
          ? `/dashboard/engagements/${engagementId}`
          : `/portal/engagement/${engagementId}`
      );
    } else if (n.entidad_tipo === "engagement" && engagementId) {
      navigate(`/dashboard/engagements/${engagementId}`);
    }
    onClose();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-stretch gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted/50"
      )}
    >
      <span className={cn("w-1 shrink-0 rounded-full", barColor)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-semibold text-foreground">{n.titulo}</p>
        <p className="mt-0.5 font-body text-xs text-foreground/80 line-clamp-2">
          {n.mensaje}
        </p>
        <p className="mt-1 font-body text-[11px] text-muted-foreground">
          {formatRelativeDate(n.created_at)}
        </p>
      </div>
      {n.estado === "pendiente" && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="No leída" />
      )}
    </button>
  );
};

export default NotificacionItem;
