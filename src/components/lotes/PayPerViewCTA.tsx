import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useConfigPayPerView } from "@/hooks/useConfigPayPerView";
import { useGenerarPagoWompi } from "@/hooks/useGenerarPagoWompi";
import { useAuth } from "@/contexts/AuthContext";
import { formatCOP } from "@/lib/format-moneda";

interface Props {
  loteId: string;
  accesoActivoExpira?: string | null;
}

const formatDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

const PayPerViewCTA = ({ loteId, accesoActivoExpira }: Props) => {
  const { isDesarrollador } = useAuth();
  const { data: config } = useConfigPayPerView();
  const generar = useGenerarPagoWompi();
  const [loading, setLoading] = useState(false);

  if (accesoActivoExpira) {
    return (
      <Card className="p-4 bg-primary/5 border-primary/20 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-medium text-sm">Acceso desbloqueado</p>
          <p className="text-xs text-muted-foreground">
            Vence el {formatDate(accesoActivoExpira)}
          </p>
        </div>
        <Badge variant="secondary">Pay-per-view</Badge>
      </Card>
    );
  }

  if (!isDesarrollador || !config?.activo) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await generar.mutateAsync({ tipo: "pay_per_view", lote_id: loteId });
      if (res?.payment_url) window.location.href = res.payment_url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Desbloquear solo este lote por {formatCOP(config.precio_cop)} ({config.dias_acceso} días)
      </Button>
      <p className="text-xs text-muted-foreground max-w-md text-center">
        Al desbloquear aceptarás el Acuerdo de No Elusión: cualquier negocio sobre este activo se
        tramita exclusivamente a través de 360Lateral.
      </p>
    </div>
  );
};

export default PayPerViewCTA;
