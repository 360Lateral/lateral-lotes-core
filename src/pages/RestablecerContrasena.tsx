import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Status = "checking" | "valid" | "invalid";

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const RestablecerContrasena = () => {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdminOrExperto, isPropietario, isComisionista, isDesarrollador } = useAuth();

  useEffect(() => {
    let recoveryDetected = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        recoveryDetected = true;
        setStatus("valid");
      }
    });

    // Fallback: check existing session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        recoveryDetected = true;
        setStatus("valid");
      }
    });

    const timer = setTimeout(() => {
      if (!recoveryDetected) setStatus("invalid");
    }, 2000);

    return () => {
      clearTimeout(timer);
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!PASSWORD_RE.test(password)) {
      setError("Mínimo 8 caracteres, con al menos una letra y un número.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      toast({
        title: "No se pudo actualizar la contraseña",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Contraseña actualizada",
      description: "Iniciando sesión...",
    });

    setTimeout(() => {
      if (isAdminOrExperto) navigate("/dashboard", { replace: true });
      else if (isPropietario || isComisionista) navigate("/dashboard/owner", { replace: true });
      else if (isDesarrollador) navigate("/lotes", { replace: true });
      else navigate("/dashboard", { replace: true });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-light bg-card p-8">
        <div className="mb-6 flex justify-center">
          <Logo variant="on-white" />
        </div>

        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-body">Validando enlace...</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-danger">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-heading font-bold text-navy">Enlace expirado</h1>
            <p className="text-sm text-muted-foreground font-body">
              El enlace expiró o no es válido. Solicita uno nuevo.
            </p>
            <Button asChild className="w-full">
              <Link to="/recuperar-contrasena">Solicitar nuevo enlace</Link>
            </Button>
          </div>
        )}

        {status === "valid" && (
          <>
            <h1 className="mb-2 text-center text-2xl font-heading font-bold text-navy">
              Restablecer contraseña
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground font-body">
              Crea una contraseña nueva para tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-body text-carbon">
                  Nueva contraseña
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-body text-carbon">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {error && <p className="text-sm text-danger font-body">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RestablecerContrasena;
