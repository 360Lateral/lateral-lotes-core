import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/ui/HeroImage";
import { Home, Building2, UserCheck, Check } from "lucide-react";

const BIENVENIDA_IMG = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=85";

type Perfil = "dueno" | "developer" | "comisionista";

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
    id: "comisionista",
    icon: UserCheck,
    titulo: "Represento a un dueño",
    descripcion: "Soy comisionista o representante autorizado de un propietario",
    beneficios: [
      "Gestiona lotes en nombre del propietario",
      "Deberás subir un documento de autorización",
      "Conecta con compradores calificados",
    ],
    accentClass: "border-emerald-500 text-emerald-500",
    borderClass: "hover:border-emerald-500",
    checkClass: "text-emerald-500",
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
  const { user, isAdminOrAsesor, userType, loading } = useAuth();

  // If already logged in, redirect based on role/userType
  useEffect(() => {
    if (!loading && user) {
      if (isAdminOrAsesor) {
        navigate("/dashboard", { replace: true });
      } else if (userType === "dueno") {
        navigate("/dashboard/owner", { replace: true });
      } else if (userType === "developer") {
        navigate("/dashboard/developer", { replace: true });
      } else if (userType === "comisionista") {
        navigate("/dashboard/owner", { replace: true });
      } else {
        navigate("/lotes", { replace: true });
      }
    }
  }, [user, loading, isAdminOrAsesor, userType, navigate]);

  const handleContinue = () => {
    if (!selected) return;
    navigate(`/login?perfil=${selected}`);
  };

  if (loading) return null;

  return (
    <HeroImage imageUrl={BIENVENIDA_IMG} height="100vh" overlay="dark">
    <div className="flex flex-col items-center px-4 py-12">
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
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
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
                      : perfil.id === "comisionista"
                      ? "bg-emerald-500/20 text-emerald-500"
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
    </HeroImage>
  );
};

export default Bienvenida;
