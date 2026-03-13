import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

    // Fetch roles to determine redirect
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-light bg-card p-8">
        <div className="mb-6 flex justify-center">
          <Logo variant="on-white" />
        </div>

        <h1 className="mb-6 text-center text-xl font-bold text-carbon font-body">
          Iniciar sesión
        </h1>

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

          {error && (
            <p className="text-sm text-danger font-body">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

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
