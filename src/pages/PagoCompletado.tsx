import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";

type EstadoTrans = "pendiente" | "aprobada" | "declinada" | "expirada" | "reembolsada" | "error" | "no_encontrada";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 30000;

const PagoCompletado = () => {
  const [params] = useSearchParams();
  const ref = params.get("ref") ?? params.get("id") ?? "";
  const [estado, setEstado] = useState<EstadoTrans | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);

  useEffect(() => {
    if (!ref) {
      setEstado("no_encontrada");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    const fetchOnce = async () => {
      const { data, error } = await (supabase as any)
        .from("transacciones")
        .select("estado")
        .eq("wompi_reference", ref)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Error consultando transacción:", error);
      }

      if (!data) {
        setEstado("no_encontrada");
      } else {
        setEstado(data.estado as EstadoTrans);
        if (data.estado === "aprobada") {
          setPollingActive(false);
          setTimeout(() => { window.location.href = "/portal"; }, 3000);
        } else if (["declinada", "error", "expirada", "reembolsada"].includes(data.estado)) {
          setPollingActive(false);
        }
      }
      setLoading(false);
    };

    fetchOnce();

    const interval = setInterval(() => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(interval);
        setPollingActive(false);
        return;
      }
      fetchOnce();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ref]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {loading && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
            <p className="font-body text-muted-foreground">Consultando estado del pago...</p>
          </>
        )}

        {!loading && estado === "aprobada" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <h1 className="font-display text-2xl font-semibold">¡Pago aprobado!</h1>
            <p className="font-body text-muted-foreground">
              Tu engagement ya está activo. Te llevamos al portal en 3 segundos...
            </p>
            <Button asChild><Link to="/portal">Ir al portal ahora</Link></Button>
          </>
        )}

        {!loading && estado === "pendiente" && (
          <>
            <Clock className="h-12 w-12 mx-auto text-blue-600" />
            <h1 className="font-display text-2xl font-semibold">Procesando tu pago</h1>
            <p className="font-body text-muted-foreground">
              Estamos confirmando tu pago con la pasarela. Te avisaremos por email cuando se confirme.
              Puedes cerrar esta página con tranquilidad.
            </p>
            {pollingActive && (
              <p className="font-body text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Verificando automáticamente...
              </p>
            )}
            <Button variant="outline" asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && (estado === "declinada" || estado === "error" || estado === "expirada") && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="font-display text-2xl font-semibold">El pago no se completó</h1>
            <p className="font-body text-muted-foreground">
              Tu pago fue {estado}. Puedes reintentar el cobro desde el portal.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && estado === "reembolsada" && (
          <>
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600" />
            <h1 className="font-display text-2xl font-semibold">Pago reembolsado</h1>
            <p className="font-body text-muted-foreground">
              Esta transacción fue reembolsada. Si tienes dudas, contacta al equipo.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && estado === "no_encontrada" && (
          <>
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600" />
            <h1 className="font-display text-2xl font-semibold">Transacción no encontrada</h1>
            <p className="font-body text-muted-foreground">
              No encontramos esta transacción. Si completaste un pago, te llegará confirmación por email.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default PagoCompletado;
