import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MailX, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EstadoValidacion =
  | "validando"
  | "valido"
  | "invalido"
  | "ya_usado"
  | "confirmando"
  | "confirmado"
  | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState<EstadoValidacion>("validando");
  const [email, setEmail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setEstado("invalido");
      return;
    }
    const validar = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const data = await res.json();
        if (!res.ok) {
          setEstado("invalido");
          setErrorMsg(data?.error ?? "Token inválido");
          return;
        }
        if (data?.alreadyUsed || data?.already_used) {
          setEstado("ya_usado");
          setEmail(data?.email ?? "");
          return;
        }
        setEstado("valido");
        setEmail(data?.email ?? "");
      } catch (e: any) {
        setEstado("error");
        setErrorMsg(e?.message ?? "Error de red");
      }
    };
    validar();
  }, [token]);

  const confirmar = async () => {
    if (!token) return;
    setEstado("confirmando");
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setEstado("confirmado");
    } catch (e: any) {
      setEstado("error");
      setErrorMsg(e?.message ?? "No se pudo procesar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 space-y-5 text-center">
        {estado === "validando" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Verificando enlace…</p>
          </>
        )}

        {estado === "valido" && (
          <>
            <MailX className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Confirmar baja</h1>
            <p className="text-sm text-muted-foreground">
              ¿Quieres dejar de recibir correos en <strong>{email || "este correo"}</strong>?
            </p>
            <Button onClick={confirmar} className="w-full">
              Confirmar y darme de baja
            </Button>
          </>
        )}

        {estado === "confirmando" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Procesando…</p>
          </>
        )}

        {estado === "confirmado" && (
          <>
            <Check className="h-10 w-10 text-green-600 mx-auto" />
            <h1 className="text-xl font-semibold">Listo</h1>
            <p className="text-sm text-muted-foreground">
              {email ? <>El correo <strong>{email}</strong> ya no recibirá mensajes nuestros.</> : "Tu baja fue procesada."}
            </p>
          </>
        )}

        {estado === "ya_usado" && (
          <>
            <Check className="h-10 w-10 text-green-600 mx-auto" />
            <h1 className="text-xl font-semibold">Ya estás dado de baja</h1>
            <p className="text-sm text-muted-foreground">
              {email ? <>El correo <strong>{email}</strong> ya no recibe nuestros mensajes.</> : "Esta baja ya se procesó."}
            </p>
          </>
        )}

        {(estado === "invalido" || estado === "error") && (
          <>
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Enlace no válido</h1>
            <p className="text-sm text-muted-foreground">
              {errorMsg || "El enlace de baja no es válido o ya expiró."}
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
