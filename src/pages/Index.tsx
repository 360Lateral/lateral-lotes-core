import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/ui/HeroImage";
import {
  LayoutDashboard,
  Search,
  MapPin,
  FileCheck,
  Handshake,
  User,
  ShieldCheck,
  Check,
  ArrowRight,
  Play,
  Building2,
  Award,
  type LucideIcon,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

const HERO_AERIAL_URL =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=2400&q=80&auto=format&fit=crop";

const HeroAnonimo = () => (
  <section className="relative w-full overflow-hidden" style={{ minHeight: "640px" }}>
    {/* Capa 1: imagen aerial con Ken Burns */}
    <img
      src={HERO_AERIAL_URL}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
    />

    {/* Capa 2: overlay navy multiply */}
    <div
      className="absolute inset-0 z-[1]"
      style={{ background: "hsl(var(--navy) / 0.85)", mixBlendMode: "multiply" }}
    />

    {/* Capa 3: overlay degradado para contraste */}
    <div
      className="absolute inset-0 z-[2]"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--navy) / 0.7) 0%, hsl(var(--navy) / 0.4) 50%, hsl(var(--navy) / 0.85) 100%)",
      }}
    />

    {/* Capa 4: grid decorativo sutil */}
    <div
      className="absolute inset-0 z-[3] opacity-[0.08]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--orange)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--orange)) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />

    {/* Contenido */}
    <div className="relative z-[4] mx-auto flex min-h-[640px] w-full max-w-7xl flex-col items-center justify-center gap-12 px-4 py-20 md:flex-row md:justify-between md:gap-8 md:py-24 animate-fade-in">
      <div className="flex max-w-2xl flex-col items-start text-left">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-body text-xs font-semibold uppercase tracking-wider text-white/90">
            Plataforma SaaS B2B verificada
          </span>
        </div>

        <h1 className="font-body text-4xl font-bold leading-[1.1] text-white md:text-6xl">
          Tu lote tiene más valor del que crees
        </h1>

        <p className="mt-6 max-w-xl font-body text-base text-white/80 md:text-lg">
          Diagnóstico jurídico, valoración técnica y conexión con desarrolladores calificados.
          Todo en una plataforma curada para Colombia.
        </p>

        <ul className="mt-8 flex flex-wrap gap-2">
          {["Diagnóstico 360°", "Información protegida", "Pagos seguros con Wompi"].map(
            (label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-body text-xs text-white/85 backdrop-blur-sm"
              >
                <Check className="h-3.5 w-3.5 text-primary" />
                {label}
              </li>
            )
          )}
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="hero" size="xl" asChild>
            <Link to="/diagnostico">
              Diagnosticar mi lote gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="xl"
            asChild
            className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
          >
            <Link to="/lotes">
              <Play className="mr-2 h-4 w-4" />
              Ver lote de ejemplo
            </Link>
          </Button>
        </div>

        <Link
          to="/login"
          className="mt-6 font-body text-sm text-white/60 transition-colors hover:text-white"
        >
          ¿Ya tienes cuenta? Iniciar sesión →
        </Link>
      </div>

      {/* Columna derecha: SVG 360° */}
      <div className="hidden md:flex flex-shrink-0 items-center justify-center">
        <div className="relative h-72 w-72 lg:h-80 lg:w-80">
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 h-full w-full animate-spin-slow"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--orange))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(var(--orange))" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 8"
            />
            <circle
              cx="100"
              cy="100"
              r="74"
              fill="none"
              stroke="hsl(var(--orange) / 0.4)"
              strokeWidth="1"
            />
            <circle cx="100" cy="8" r="3" fill="hsl(var(--orange))" />
            <circle cx="192" cy="100" r="2" fill="hsl(var(--orange) / 0.7)" />
            <circle cx="100" cy="192" r="2" fill="hsl(var(--orange) / 0.7)" />
            <circle cx="8" cy="100" r="2" fill="hsl(var(--orange) / 0.7)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-body text-6xl font-bold tracking-tight text-white lg:text-7xl">
              360°
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const TrustStat = ({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) => {
  const numericValue = parseInt(value, 10);
  const isNumber = !isNaN(numericValue);
  const { value: animated, ref } = useCountUp({ target: isNumber ? numericValue : 0 });

  return (
    <div ref={ref} className="flex items-center gap-3 px-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="font-body text-2xl font-bold text-secondary tabular-nums md:text-3xl">
          {isNumber ? animated : value}
        </span>
        <span className="font-body text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};



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
      return "Experto";
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
    { label: "Diagnósticos", value: "—" },
    { label: "Resolutorías", value: "—" },
  ] } = useQuery({
    queryKey: ["trust-stats"],
    queryFn: async () => {
      const [lotesRes, ciudadesRes, diagRes, resoRes] = await Promise.all([
        supabase.from("lotes_publicos" as any).select("id", { count: "exact", head: true }).eq("estado_disponibilidad", "Disponible"),
        supabase.from("lotes_publicos" as any).select("ciudad"),
        supabase.rpc("count_diagnosticos"),
        supabase.from("lotes_publicos" as any).select("id", { count: "exact", head: true }).eq("has_resolutoria", true),
      ]);
      const uniqueCiudades = new Set((ciudadesRes.data ?? []).map((l: any) => l.ciudad).filter(Boolean));
      return [
        { label: "Lotes disponibles", value: String(lotesRes.count ?? 0) },
        { label: "Municipios", value: String(uniqueCiudades.size) },
        { label: "Diagnósticos", value: String(diagRes.data ?? 0) },
        { label: "Resolutorías", value: String(resoRes.count ?? 0) },
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
              <Link to="/portal">
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
    return <HeroAnonimo />;
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
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-around gap-6 px-4">
          <TrustStat icon={MapPin} value={trustStats[0]?.value ?? "—"} label={trustStats[0]?.label ?? "Lotes disponibles"} />
          <TrustStat icon={Building2} value={trustStats[1]?.value ?? "—"} label={trustStats[1]?.label ?? "Municipios"} />
          <TrustStat icon={FileCheck} value={trustStats[2]?.value ?? "—"} label={trustStats[2]?.label ?? "Diagnósticos"} />
          <TrustStat icon={Award} value={trustStats[3]?.value ?? "—"} label={trustStats[3]?.label ?? "Resolutorías"} />
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
