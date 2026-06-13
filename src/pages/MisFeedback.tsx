import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader2 } from "lucide-react";
import { useMisFeedback } from "@/hooks/feedback/useMisFeedback";
import EmptyState from "@/components/ui/EmptyState";
import FeedbackDetalle from "@/components/feedback/FeedbackDetalle";
import {
  ESTADO_LABEL,
  ESTADO_TONO,
  SEVERIDAD_LABEL,
  SEVERIDAD_TONO,
  TIPO_LABEL,
  type EstadoFeedback,
  type SeveridadFeedback,
  type TipoFeedback,
} from "@/lib/feedback-transitions";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { cn } from "@/lib/utils";

const MisFeedback = () => {
  const { data: tickets = [], isLoading } = useMisFeedback();
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = tickets.length;
    const resueltos = tickets.filter((t: any) => t.estado === "resuelto").length;
    return { total, resueltos };
  }, [tickets]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Mis tickets de feedback
          </h1>
          <p className="text-sm text-muted-foreground">
            Tienes {stats.total} tickets · {stats.resueltos} resueltos
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            titulo="Aún no has enviado feedback"
            descripcion="Usa el botón flotante 'Feedback' en cualquier pantalla para reportar un bug o sugerir una mejora."
          />
        ) : (
          <div className="space-y-2">
            {tickets.map((t: any) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setDetalleId(t.id)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {TIPO_LABEL[t.tipo as TipoFeedback]}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] border-0",
                        SEVERIDAD_TONO[t.severidad as SeveridadFeedback],
                      )}
                    >
                      {SEVERIDAD_LABEL[t.severidad as SeveridadFeedback]}
                    </Badge>
                    <Badge
                      className={cn(
                        "text-[10px] border-0",
                        ESTADO_TONO[t.estado as EstadoFeedback],
                      )}
                    >
                      {ESTADO_LABEL[t.estado as EstadoFeedback]}
                    </Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {formatRelativeDate(t.updated_at ?? t.created_at)}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {t.descripcion}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <FeedbackDetalle
        ticketId={detalleId}
        onClose={() => setDetalleId(null)}
        modoAdmin={false}
      />
    </div>
  );
};

export default MisFeedback;
