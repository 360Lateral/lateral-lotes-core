import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      toast({
        title: "Correo inválido",
        description: "Ingresa un correo electrónico válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const redirectTo = `${
      import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin
    }/restablecer-contrasena`;

    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });
    setLoading(false);

    if (error) {
      console.error("resetPasswordForEmail error:", error);
      toast({
        title: "No se pudo enviar el enlace",
        description: "Verifica el correo e intenta de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-light bg-card p-8">
        <div className="mb-6 flex justify-center">
          <Logo variant="on-white" />
        </div>

        {!sent ? (
          <>
            <h1 className="mb-2 text-center text-2xl font-heading font-bold text-navy">
              Recuperar contraseña
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground font-body">
              Te enviaremos un enlace a tu correo para que puedas restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body text-carbon">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
              ✓
            </div>
            <h1 className="text-xl font-heading font-bold text-navy">Enlace enviado</h1>
            <p className="text-sm text-muted-foreground font-body">
              Si el correo <span className="font-semibold text-foreground">{email}</span> está
              registrado, recibirás un mensaje con instrucciones para restablecer tu contraseña.
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Revisa también tu carpeta de spam.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Volver al inicio de sesión</Link>
            </Button>
          </div>
        )}

        {!sent && (
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-navy font-body underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuperarContrasena;
