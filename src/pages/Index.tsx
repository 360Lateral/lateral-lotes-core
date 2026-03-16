import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Search, MapPin, FileCheck, Handshake, User } from "lucide-react";

const Index = () => {
  const { user, userType, isAdminOrAsesor, isDeveloper, roles, loading: authLoading } = useAuth();
  const isDueno = userType === "dueno";

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

    // Logged-in owner
    if (user && isDueno) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <div className="mb-4 flex items-center gap-2 rounded-full bg-secondary-foreground/10 px-4 py-1.5">
            <User className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold text-secondary-foreground">{displayName}</span>
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-body text-[11px] font-bold text-primary-foreground">{getProfileLabel()}</span>
          </div>
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Gestiona tus lotes
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Publica, edita y da seguimiento a tus terrenos. El equipo 360Lateral te ayuda a conectar con compradores calificados.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard/lotes/nuevo">
                <Plus className="mr-2 h-5 w-5" />
                Publicar nuevo lote
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
              <Link to="/diagnostico">Solicitar Diagnóstico 360°</Link>
            </Button>
          </div>
        </section>
      );
    }

    // Logged-in developer
    if (user && isDeveloper) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <div className="mb-4 flex items-center gap-2 rounded-full bg-secondary-foreground/10 px-4 py-1.5">
            <User className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold text-secondary-foreground">{displayName}</span>
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-body text-[11px] font-bold text-primary-foreground">{getProfileLabel()}</span>
          </div>
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Encuentra tu próximo terreno
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Explora lotes verificados con información técnica, normativa y financiera completa para tomar decisiones informadas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/lotes">
                <Search className="mr-2 h-5 w-5" />
                Explorar catálogo
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
              <Link to="/dashboard/developer">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Mi dashboard
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
          <div className="mb-4 flex items-center gap-2 rounded-full bg-secondary-foreground/10 px-4 py-1.5">
            <User className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold text-secondary-foreground">{displayName}</span>
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-body text-[11px] font-bold text-primary-foreground">{getProfileLabel()}</span>
          </div>
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

    // Not logged in — simplified hero focused on registration
    return (
      <section className="flex min-h-[500px] flex-col items-center justify-center bg-secondary px-4 text-center">
        <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
          Tu lote tiene más valor del que crees
        </h1>
        <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
          Conectamos tierra con su mejor destino: venta, desarrollo o viabilización. Con información técnica, normativa y financiera completa.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button variant="hero" size="xl" asChild>
            <Link to="/bienvenida">Comenzar ahora</Link>
          </Button>
          <Button variant="outline" size="xl" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
        <Link to="/diagnostico" className="mt-4 font-body text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
          ¿Tienes un lote? Descubre su valor gratis →
        </Link>
      </section>
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
