import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoteCard from "@/components/LoteCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, X, Plus, LayoutDashboard, Search } from "lucide-react";

const Index = () => {
  const { user, userType, isAdminOrAsesor, loading: authLoading } = useAuth();

  // Determine profile type
  const isDueno = userType === "dueno";
  const isDeveloper = userType === "desarrollador";

  // Tab for owners: "mis" or "publicos"
  const [ownerTab, setOwnerTab] = useState<"mis" | "publicos">("mis");

  // Filters
  const [ciudad, setCiudad] = useState<string>("todas");
  const [uso, setUso] = useState<string>("todos");
  const [areaMin, setAreaMin] = useState<string>("");
  const [areaMax, setAreaMax] = useState<string>("");

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

  const { data: lotes, isLoading } = useQuery({
    queryKey: ["lotes-home"],
    queryFn: async () => {
      const { data: lotesData, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, barrio, ciudad, area_total_m2, estado_disponibilidad, destacado, lat, lng, score_juridico, score_normativo, score_servicios, has_resolutoria, foto_url, owner_id, es_publico");

      if (error) throw error;

      const ids = lotesData.map((l) => l.id);

      const [{ data: preciosData }, { data: normativaData }] = await Promise.all([
        supabase.from("precios").select("lote_id, precio_m2_cop").in("lote_id", ids),
        supabase.from("normativa_urbana").select("lote_id, uso_principal").in("lote_id", ids),
      ]);

      const precioMap = new Map(preciosData?.map((p) => [p.lote_id, p.precio_m2_cop]) ?? []);
      const usoMap = new Map(normativaData?.map((n) => [n.lote_id, n.uso_principal]) ?? []);

      return lotesData.map((l) => ({
        ...l,
        precio_m2: precioMap.get(l.id) ?? 0,
        uso_principal: usoMap.get(l.id) ?? null,
      }));
    },
  });

  // Derive unique cities & usos for selectors
  const ciudades = useMemo(() => {
    if (!lotes) return [];
    return [...new Set(lotes.map((l) => l.ciudad).filter(Boolean))] as string[];
  }, [lotes]);

  const usos = useMemo(() => {
    if (!lotes) return [];
    return [...new Set(lotes.map((l) => l.uso_principal).filter(Boolean))] as string[];
  }, [lotes]);

  // Apply filters client-side
  const filteredLotes = useMemo(() => {
    if (!lotes) return [];

    let subset = lotes;

    // For owners viewing "mis lotes", show only their lots
    if (user && isDueno && ownerTab === "mis") {
      subset = subset.filter((l) => (l as any).owner_id === user.id);
    } else if (user && isDueno && ownerTab === "publicos") {
      subset = subset.filter((l) => (l as any).es_publico === true);
    }
    // For developers or anonymous, RLS already filters — just show what's returned
    // (public lots for anon, public+own for authenticated)

    return subset.filter((l) => {
      if (ciudad !== "todas" && l.ciudad !== ciudad) return false;
      if (uso !== "todos" && l.uso_principal !== uso) return false;
      const area = Number(l.area_total_m2) || 0;
      if (areaMin && area < Number(areaMin)) return false;
      if (areaMax && area > Number(areaMax)) return false;
      return true;
    });
  }, [lotes, ciudad, uso, areaMin, areaMax, user, isDueno, ownerTab]);

  const hasActiveFilters = ciudad !== "todas" || uso !== "todos" || areaMin !== "" || areaMax !== "";

  const clearFilters = () => {
    setCiudad("todas");
    setUso("todos");
    setAreaMin("");
    setAreaMax("");
  };

  // Hero content based on profile
  const renderHero = () => {
    if (authLoading) return null;

    // Logged-in owner
    if (user && isDueno) {
      return (
        <section className="flex min-h-[400px] flex-col items-center justify-center bg-secondary px-4 text-center">
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

    // Logged-in admin — keep current generic hero with dashboard access
    if (user && isAdminOrAsesor) {
      return (
        <section className="flex min-h-[500px] flex-col items-center justify-center bg-secondary px-4 text-center">
          <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
            Tu lote tiene más valor del que crees
          </h1>
          <p className="mt-4 max-w-xl font-body text-base text-secondary-foreground/70 md:text-lg">
            Conectamos tierra con su mejor destino: venta, desarrollo o viabilización.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Ir al Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
              <Link to="/lotes">Explorar lotes</Link>
            </Button>
          </div>
        </section>
      );
    }

    // Not logged in — default hero
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
            <Link to="/bienvenida">Explorar lotes</Link>
          </Button>
          <Button variant="outline" size="xl" className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
            <Link to="/bienvenida?preselect=dueno">Publicar mi lote gratis</Link>
          </Button>
        </div>
        <Link to="/diagnostico" className="mt-4 font-body text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
          ¿Tienes un lote? Descubre su valor gratis →
        </Link>
      </section>
    );
  };

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

      {/* Lotes section */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-body text-2xl font-bold text-foreground">
            {user && isDueno
              ? ownerTab === "mis" ? "Mis lotes" : "Catálogo público"
              : "Lotes disponibles"}
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Mostrando {filteredLotes.length} de {lotes?.length ?? 0} lotes
          </p>
        </div>

        {/* Owner tabs */}
        {user && isDueno && (
          <div className="mb-6 flex gap-2">
            <Button
              variant={ownerTab === "mis" ? "default" : "outline"}
              size="sm"
              onClick={() => setOwnerTab("mis")}
            >
              Mis lotes
            </Button>
            <Button
              variant={ownerTab === "publicos" ? "default" : "outline"}
              size="sm"
              onClick={() => setOwnerTab("publicos")}
            >
              Catálogo público
            </Button>
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-8 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-body text-sm font-semibold text-foreground">Filtros</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ml-auto flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="font-body text-xs text-muted-foreground">Ciudad</Label>
              <Select value={ciudad} onValueChange={setCiudad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {ciudades.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-body text-xs text-muted-foreground">Uso de suelo</Label>
              <Select value={uso} onValueChange={setUso}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {usos.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-body text-xs text-muted-foreground">Área mínima (m²)</Label>
              <Input
                type="number"
                placeholder="0"
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                min={0}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-body text-xs text-muted-foreground">Área máxima (m²)</Label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                min={0}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-lg border border-border bg-muted" />
            ))}
          </div>
        ) : filteredLotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <p className="font-body text-lg font-semibold text-foreground">
              {user && isDueno && ownerTab === "mis"
                ? "Aún no tienes lotes publicados"
                : "No se encontraron lotes"}
            </p>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {user && isDueno && ownerTab === "mis"
                ? "Publica tu primer lote y conéctalo con compradores"
                : "Intenta ajustar los filtros"}
            </p>
            {user && isDueno && ownerTab === "mis" ? (
              <Button variant="default" size="sm" className="mt-4" asChild>
                <Link to="/dashboard/lotes/nuevo">
                  <Plus className="mr-2 h-4 w-4" />
                  Publicar lote
                </Link>
              </Button>
            ) : hasActiveFilters ? (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLotes.map((lote) => (
              <LoteCard
                key={lote.id}
                id={lote.id}
                nombre={lote.nombre_lote}
                barrio={lote.barrio ?? ""}
                area_m2={Number(lote.area_total_m2) || 0}
                precio_m2={Number(lote.precio_m2) || 0}
                estado={lote.estado_disponibilidad}
                lat={lote.lat ? Number(lote.lat) : null}
                lng={lote.lng ? Number(lote.lng) : null}
                score_juridico={lote.score_juridico}
                score_normativo={lote.score_normativo}
                score_servicios={lote.score_servicios}
                uso_principal={lote.uso_principal}
                has_resolutoria={lote.has_resolutoria}
                foto_url={(lote as any).foto_url}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Index;
