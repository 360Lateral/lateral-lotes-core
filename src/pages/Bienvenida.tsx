import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Home, Building2, Check } from "lucide-react";

type Perfil = "dueno" | "developer";

const perfiles: {
  id: Perfil;
  icon: typeof Home;
  titulo: string;
  descripcion: string;
  beneficios: string[];
  accentClass: string;
  borderClass: string;
  checkClass: string;
}[] = [
  {
    id: "dueno",
    icon: Home,
    titulo: "Tengo un lote",
    descripcion: "Quiero vender, desarrollar o conocer el valor de mi tierra",
    beneficios: [
      "Diagnóstico gratuito de tu lote",
      "Conexión con desarrolladores calificados",
      "Resolutoría 360° para viabilizar tu predio",
    ],
    accentClass: "border-orange text-orange",
    borderClass: "hover:border-orange",
    checkClass: "text-orange",
  },
  {
    id: "developer",
    icon: Building2,
    titulo: "Busco lotes",
    descripcion: "Quiero encontrar tierra para desarrollar o invertir",
    beneficios: [
      "Lotes con ficha normativa verificada",
      "Score de viabilidad jurídica y técnica",
      "Alertas cuando aparezcan lotes de mi interés",
    ],
    accentClass: "border-blue-500 text-blue-500",
    borderClass: "hover:border-blue-500",
    checkClass: "text-blue-500",
  },
];

const Bienvenida = () => {
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get("preselect") as Perfil | null;
  const [selected, setSelected] = useState<Perfil | null>(preselect);
  const navigate = useNavigate();
  const { user, isAdminOrAsesor, loading } = useAuth();

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      navigate(isAdminOrAsesor ? "/dashboard" : "/lotes", { replace: true });
    }
  }, [user, loading, isAdminOrAsesor, navigate]);

  const handleContinue = () => {
    if (!selected) return;
    navigate(`/login?perfil=${selected}`);
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: "#1a2744" }}>
      {/* Logo */}
      <div className="mb-8">
        <Logo variant="on-navy" />
      </div>

      {/* Title */}
      <h1 className="mb-2 text-center font-body text-3xl font-bold text-white md:text-4xl">
        ¿Cómo quieres usar 360 Lateral?
      </h1>
      <p className="mb-10 text-center font-body text-base text-gray-300">
        Elige tu perfil para personalizar tu experiencia
      </p>

      {/* Cards */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        {perfiles.map((perfil) => {
          const isSelected = selected === perfil.id;
          const Icon = perfil.icon;

          return (
            <button
              key={perfil.id}
              onClick={() => setSelected(perfil.id)}
              className={`group flex cursor-pointer flex-col items-start rounded-xl border-2 bg-white/5 p-6 text-left backdrop-blur-sm transition-all ${
                isSelected
                  ? perfil.accentClass
                  : `border-white/10 ${perfil.borderClass}`
              }`}
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-lg ${
                  isSelected
                    ? perfil.id === "dueno"
                      ? "bg-orange/20 text-orange"
                      : "bg-blue-500/20 text-blue-500"
                    : "bg-white/10 text-white/60"
                }`}
              >
                <Icon size={28} />
              </div>

              <h2 className="mb-1 font-body text-xl font-bold text-white">
                {perfil.titulo}
              </h2>
              <p className="mb-4 font-body text-sm text-gray-300">
                {perfil.descripcion}
              </p>

              <ul className="space-y-2">
                {perfil.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 font-body text-sm text-gray-200">
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${perfil.checkClass}`}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      <Button
        variant="default"
        size="xl"
        className="mt-10"
        disabled={!selected}
        onClick={handleContinue}
      >
        Continuar
      </Button>

      {/* Back link */}
      <a
        href="/"
        className="mt-6 font-body text-sm text-gray-400 underline transition-colors hover:text-white"
      >
        ← Volver al inicio
      </a>
    </div>
  );
};

export default Bienvenida;
