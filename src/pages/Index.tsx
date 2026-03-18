import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/ui/HeroImage";
import { LayoutDashboard, Search, MapPin, FileCheck, Handshake, User } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=85";

const Index = () => {
  const { user, userType, isAdminOrAsesor, isDeveloper, roles, loading: authLoading } = useAuth();
  const isDueno = userType === "dueno" || userType === "comisionista";

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const getProfileLabel = () => {
    if (isAdminOrAsesor) {
      if (roles.includes("super_admin")) return "Super Admin";
      if (roles.includes("admin")) return "Administrador";
      return "Asesor";
    }
    if (userType === "comisionista") return "Comisionista";
    if (isDueno) return "Dueño de Lote";
    if (isDeveloper) return "Desarrollador / Inversionista";
    return "Usuario";
  };

  // Trust bar stats
  const { data: trustStats = [
    { label: "Lotes disponibles", value: "—" },
    { label: "Municipios", value: "—" },
    { label: "Diagnósticos realizados", value: "—" },
    { label: "Resolutoría 360° Verificada", value: "—" },
  ] } = useQuery({
    queryKey: ["trust-stats"],
    queryFn: async () => {
      const [lotesRes, ciudadesRes, diagRes, resoRes] = await Promise.all([
        supabase.from("lotes").select("id", { count: "exact", head: true }).eq("estado_disponibilidad", "Disponible"),
        supabase.from("lotes").select("ciudad"),
        supabase.from("diagnosticos").select("id", { count: "exact", head: true }),
        supabase.from("lotes").select("id", { count: "exact", head: true }).eq("has_resolutoria", true),
      ]);
      const uniqueCiudades = new Set((ciudadesRes.data ?? []).map((l: any) => l.ciudad).filter(Boolean));
      return [
        { label: "Lotes disponibles", value: String(lotesRes.count ?? 0) },
        { label: "Municipios", value: String(uniqueCiudades.size) },
        { label: "Diagnósticos realizados", value: String(diagRes.count ?? 0) },
        { label: "Resolutoría 360° Verificada", value: String(resoRes.count ?? 0) },
      ];
    },
  });

  const renderHero = () => {
    if (authLoading) return null;

    const ProfileBadge = () => (
      <div className="mb-4 flex items-center gap-2 rounded-full bg-secondary-foreground/10 px-4 py-1.5">
        <User className="h-4 w-4 text-primary" />
        <span className="font-body text-sm font-semibold text-secondary-foreground">{displayName}</span>
        <span className="rounded-full bg-primary px-2.5 py-0.5 font-body text-[11px] font-bold text-primary-foreground">{getProfileLabel()}</span>
      </div>
    );

    // Logged-in owner — 1 primary CTA only
    if (user && isDueno) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <ProfileBadge />
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Bienvenido a tu panel de lotes
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Publica terrenos, consulta diagnósticos y da seguimiento a tus negociaciones desde tu panel.
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard/owner">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Ir a Mi Panel
              </Link>
            </Button>
          </div>
        </section>
      );
    }

    // Logged-in developer — 1 primary CTA
    if (user && isDeveloper) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <ProfileBadge />
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Encuentra tu próximo terreno
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Explora lotes verificados con información técnica, normativa y financiera completa.
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" asChild>
              <Link to="/lotes">
                <Search className="mr-2 h-5 w-5" />
                Explorar catálogo
              </Link>
            </Button>
          </div>
        </section>
      );
    }

    // Logged-in admin
    if (user && isAdminOrAsesor) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <ProfileBadge />
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Panel de administración
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Gestiona lotes, leads y negociaciones desde tu dashboard.
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Ir al Dashboard
              </Link>
            </Button>
          </div>
        </section>
      );
    }

    // Logged-in generic fallback — 1 CTA
    if (user) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <ProfileBadge />
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Bienvenido a 360Lateral
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Gestiona tus lotes o explora oportunidades de inversión en terrenos.
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" asChild>
              <Link to="/lotes">
                <Search className="mr-2 h-5 w-5" />
                Explorar lotes
              </Link>
            </Button>
          </div>
        </section>
      );
    }

    // Not logged in
    return (
      <HeroImage imageUrl={HERO_IMG} height="520px" overlay="split">
        <div className="flex flex-col items-center px-4 text-center">
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-white md:text-5xl">
            Tu lote tiene más valor del que crees
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-white/70 md:text-lg">
            Conectamos tierra con su mejor destino: venta, desarrollo o viabilización. Con información técnica, normativa y financiera completa.
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" asChild>
              <Link to="/bienvenida">Comenzar ahora</Link>
            </Button>
          </div>
          <Link to="/login" className="mt-4 font-body text-sm text-white/60 hover:text-white transition-colors">
            ¿Ya tienes cuenta? Iniciar sesión →
          </Link>
        </div>
      </HeroImage>
    );
  };

  const steps = [
    {
      icon: MapPin,
      title: "Publica tu lote",
      description: "Registra la ubicación, área y datos clave de tu terreno en minutos.",
    },
    {
      icon: FileCheck,
      title: "Diagnóstico 360°",
      description: "Analizamos la normativa, viabilidad jurídica y valor de mercado de tu lote.",
    },
    {
      icon: Handshake,
      title: "Conecta con compradores",
      description: "Te vinculamos con desarrolladores e inversionistas calificados.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {renderHero()}

      {/* Trust bar */}
      <section className="border-b border-border bg-background py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-around gap-6 px-4">
          {trustStats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-body text-3xl font-bold text-primary">
                {stat.value}
              </span>
              <span className="mt-1 font-body text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — only for non-logged users */}
      {!user && (
        <section className="mx-auto w-full max-w-5xl px-4 py-16">
          <h2 className="mb-10 text-center font-body text-2xl font-bold text-foreground">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-body text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/bienvenida">Crear mi cuenta gratis</Link>
            </Button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
