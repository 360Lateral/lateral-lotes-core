import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";

import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Tab = "login" | "register";

const Login = () => {
  const [searchParams] = useSearchParams();
  const perfilParam = searchParams.get("perfil"); // "dueno" | "developer"
  const [tab, setTab] = useState<Tab>(perfilParam ? "register" : "login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userType, loading: authLoading, isAdminOrAsesor } = useAuth();

  // Redirect based on AuthContext state after login
  useEffect(() => {
    if (!loginSuccess || authLoading) return;
    if (!user) return;

    if (isAdminOrAsesor) {
      navigate("/dashboard", { replace: true });
    } else if (userType === "dueno" || userType === "comisionista") {
      navigate("/dashboard/owner", { replace: true });
    } else if (userType === "developer") {
      navigate("/lotes", { replace: true });
    } else {
      navigate("/lotes", { replace: true });
    }
  }, [loginSuccess, authLoading, user, isAdminOrAsesor, userType, navigate]);

  // Also redirect if user arrives at /login already authenticated
  useEffect(() => {
    if (authLoading || !user || loginSuccess) return;
    if (isAdminOrAsesor) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/lotes", { replace: true });
    }
  }, [authLoading, user, isAdminOrAsesor, navigate, loginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Correo o contraseña incorrectos. Intenta de nuevo.");
        return;
      }

      // Signal that login was successful — let useEffect handle redirect
      // after AuthContext finishes loading roles
      setLoginSuccess(true);
    } catch (err) {
      console.error("Login error:", err);
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || undefined,
          user_type: perfilParam || undefined,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
    setLoading(false);
  };

  const perfilLabel = perfilParam === "dueno"
    ? "Dueño de Lote"
    : perfilParam === "developer"
      ? "Desarrollador / Inversionista"
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-light bg-card p-8">
        <div className="mb-6 flex justify-center">
          <Logo variant="on-white" />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-md border border-gray-light overflow-hidden">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 text-sm font-body font-semibold transition-colors ${
              tab === "login"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 text-sm font-body font-semibold transition-colors ${
              tab === "register"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            Registrarse
          </button>
        </div>

        {perfilLabel && tab === "register" && (
          <div className="mb-4 rounded-md bg-muted px-3 py-2 text-center text-sm font-body text-muted-foreground">
            Perfil: <span className="font-semibold text-foreground">{perfilLabel}</span>
          </div>
        )}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body text-carbon">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-danger font-body">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || loginSuccess}>
              {loading ? "Ingresando..." : loginSuccess ? "Redirigiendo..." : "Iniciar sesión"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="font-body text-carbon">
                Nombre completo
              </Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="Tu nombre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="font-body text-carbon">
                Correo electrónico
              </Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="font-body text-carbon">
                Contraseña
              </Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-danger font-body">{error}</p>}
            {success && <p className="text-sm text-green-600 font-body">{success}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-navy font-body underline"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
