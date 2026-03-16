import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const navigate = useNavigate();
  const { roles } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = userRoles?.some((r) =>
        ["super_admin", "admin", "asesor"].includes(r.role)
      );

      navigate(isAdmin ? "/dashboard" : "/lotes", { replace: true });
    }

    setLoading(false);
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
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
