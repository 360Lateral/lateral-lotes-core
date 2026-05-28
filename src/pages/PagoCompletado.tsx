import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";

type EstadoTrans = "pendiente" | "aprobada" | "declinada" | "expirada" | "reembolsada" | "error";

interface TransaccionPublica {
  encontrada: boolean;
  id?: string;
  estado?: EstadoTrans;
  monto_cop?: number;
  fecha_creacion?: string;
  fecha_aprobacion?: string;
  engagement_id?: string;
  lote_nombre?: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 10;

const PagoCompletado = () => {
  const [params] = useSearchParams();
  const ref = params.get("ref") ?? params.get("id") ?? "";
  const [data, setData] = useState<TransaccionPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingExhausted, setPollingExhausted] = useState(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!ref) {
      setData({ encontrada: false });
      setLoading(false);
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOnce = async () => {
      const { data: rpcData, error } = await supabase.rpc("obtener_transaccion_publica", {
        p_reference: ref,
      });
      if (cancelled) return;
      if (error) {
        console.error("Error consultando transacción:", error);
        setLoading(false);
        return;
      }
      const result = (rpcData ?? { encontrada: false }) as unknown as TransaccionPublica;
      setData(result);
      setLoading(false);

      if (result.encontrada && result.estado === "aprobada") {
        if (interval) clearInterval(interval);
        setTimeout(() => {
          window.location.href = "/portal";
        }, 3000);
      } else if (
        result.encontrada &&
        result.estado &&
        ["declinada", "expirada", "reembolsada", "error"].includes(result.estado)
      ) {
        if (interval) clearInterval(interval);
      }
    };

    fetchOnce();

    interval = setInterval(() => {
      pollsRef.current += 1;
      if (pollsRef.current >= MAX_POLLS) {
        if (interval) clearInterval(interval);
        setPollingExhausted(true);
        return;
      }
      fetchOnce();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [ref]);

  const estado = data?.encontrada ? data.estado : undefined;
  const showPending = data?.encontrada && estado === "pendiente";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {loading && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
            <p className="font-body text-muted-foreground">Consultando estado del pago...</p>
          </>
        )}

        {!loading && data && !data.encontrada && (
          <>
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-600" />
            <h1 className="font-display text-2xl font-semibold">Transacción no encontrada</h1>
            <p className="font-body text-muted-foreground">
              No encontramos esta transacción. Si completaste un pago, te llegará confirmación por email.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && estado === "aprobada" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <h1 className="font-display text-2xl font-semibold">✓ Pago aprobado</h1>
            <p className="font-body text-muted-foreground">
              {data?.lote_nombre
                ? <>Pago aprobado para <strong>{data.lote_nombre}</strong>. Tu diagnóstico ya inició.</>
                : "Tu diagnóstico ya inició."}
            </p>
            <p className="font-body text-xs text-muted-foreground">Te llevamos al portal en 3 segundos...</p>
            <Button asChild><Link to="/portal">Ir al portal ahora</Link></Button>
          </>
        )}

        {!loading && showPending && !pollingExhausted && (
          <>
            <Clock className="h-12 w-12 mx-auto text-blue-600" />
            <h1 className="font-display text-2xl font-semibold">Procesando tu pago</h1>
            <p className="font-body text-muted-foreground">
              Estamos confirmando tu pago con la pasarela. Te avisaremos por email cuando se confirme.
            </p>
            <p className="font-body text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Verificando automáticamente...
            </p>
            <Button variant="outline" asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && showPending && pollingExhausted && (
          <>
            <Clock className="h-12 w-12 mx-auto text-blue-600" />
            <h1 className="font-display text-2xl font-semibold">Estamos procesando tu pago</h1>
            <p className="font-body text-muted-foreground">
              Si no recibes confirmación en 5 minutos, contacta a 360Lateral.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && estado === "declinada" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="font-display text-2xl font-semibold">✗ Pago declinado</h1>
            <p className="font-body text-muted-foreground">
              El pago fue declinado. Intenta de nuevo desde el portal.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && estado === "expirada" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="font-display text-2xl font-semibold">Link de pago expirado</h1>
            <p className="font-body text-muted-foreground">
              El link de pago expiró. Puedes generar uno nuevo desde el portal.
            </p>
            <Button asChild><Link to="/portal">Volver al portal</Link></Button>
          </>
        )}

        {!loading && estado === "error" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="font-display text-2xl font-semibold">Error procesando el pago</h1>
            <p className="font-body text-muted-foreground">
              Hubo un error procesando el pago. 360Lateral te contactará.
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
      </Card>
    </div>
  );
};

export default PagoCompletado;
