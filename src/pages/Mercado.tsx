import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, TrendingUp, SlidersHorizontal } from "lucide-react";
import FiltrosMercadoSticky from "@/components/mercado/FiltrosMercadoSticky";
import HeatmapMapa from "@/components/mercado/HeatmapMapa";
import TarjetaLote from "@/components/mercado/TarjetaLote";
import ResultadosHeader, { type OrdenMercado } from "@/components/mercado/ResultadosHeader";
import PaginacionMercado from "@/components/mercado/PaginacionMercado";
import {
  useMercadoPublico,
  type FiltrosMercado as FiltrosType,
  type LoteMercado,
} from "@/hooks/useMercadoPublico";
import { useStatsMercado } from "@/hooks/useStatsMercado";
import { usePersistedState } from "@/hooks/usePersistedState";

const ORDEN_KEY = "mercado_orden";
const PAGE_SIZE = 12;
const RANGO_ORDER: Record<string, number> = {
  rango_1: 1,
  rango_2: 2,
  rango_3: 3,
  rango_4: 4,
  rango_5: 5,
  no_disponible: 99,
};

const sortLotes = (a: LoteMercado, b: LoteMercado, orden: OrdenMercado): number => {
  switch (orden) {
    case "recientes":
      return new Date(b.publicado_en).getTime() - new Date(a.publicado_en).getTime();
    case "precio_asc":
      return (RANGO_ORDER[a.rango_precio] ?? 99) - (RANGO_ORDER[b.rango_precio] ?? 99);
    case "precio_desc":
      return (RANGO_ORDER[b.rango_precio] ?? 99) - (RANGO_ORDER[a.rango_precio] ?? 99);
    case "area_desc":
      return (b.area_m2_redondeada ?? 0) - (a.area_m2_redondeada ?? 0);
    default:
      return 0;
  }
};

const StatInline = ({ value, label }: { value: number | string; label: string }) => (
  <div className="text-center sm:text-left">
    <div className="font-heading text-2xl sm:text-3xl font-bold text-secondary">{value}</div>
    <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
  </div>
);

const Mercado = () => {
  const [filtros, setFiltros] = useState<FiltrosType>({});
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [orden, setOrden] = useState<OrdenMercado>(() => {
    try {
      const v = localStorage.getItem(ORDEN_KEY);
      if (v === "recientes" || v === "precio_asc" || v === "precio_desc" || v === "area_desc") return v;
    } catch {}
    return "recientes";
  });

  useEffect(() => {
    try {
      localStorage.setItem(ORDEN_KEY, orden);
    } catch {}
  }, [orden]);

  useEffect(() => {
    setPage(1);
  }, [filtros, orden]);

  const { data: lotes = [], isLoading } = useMercadoPublico(filtros);
  const { data: baseLotes = [] } = useMercadoPublico({});
  const { data: stats } = useStatsMercado();

  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>();
    baseLotes.forEach((l) => l.ciudad && set.add(l.ciudad));
    return Array.from(set).sort();
  }, [baseLotes]);

  const lotesOrdenados = useMemo(
    () => [...lotes].sort((a, b) => sortLotes(a, b, orden)),
    [lotes, orden],
  );

  const lotesPaginados = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return lotesOrdenados.slice(start, start + PAGE_SIZE);
  }, [lotesOrdenados, page]);

  const filtrosActivosCount = useMemo(() => {
    let n = 0;
    Object.values(filtros).forEach((v) => {
      if (Array.isArray(v)) n += v.length;
      else if (v) n += 1;
    });
    return n;
  }, [filtros]);

  const removeFiltro = (key: keyof FiltrosType, value?: string) => {
    setFiltros((prev) => {
      const next: FiltrosType = { ...prev };
      const current = next[key];
      if (Array.isArray(current) && value) {
        const filtered = current.filter((v) => v !== value);
        (next as any)[key] = filtered.length ? filtered : undefined;
      } else {
        (next as any)[key] = undefined;
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:py-14">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Mercado curado
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary max-w-3xl">
              Lotes disponibles en Colombia
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Información anonimizada y verificada por expertos. Acceso a detalles bajo Acuerdo de Confidencialidad.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-8 sm:gap-12 border-t border-border pt-6">
              <StatInline value={stats?.totalLotes ?? "—"} label="Lotes disponibles" />
              <StatInline value={stats?.totalMunicipios ?? "—"} label="Municipios" />
              <StatInline value={stats?.totalPublicados7d ?? "—"} label="Nuevos esta semana" />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
            {/* Filtros sticky en desktop */}
            <div className="hidden lg:block">
              <FiltrosMercadoSticky
                value={filtros}
                onChange={setFiltros}
                ciudadesDisponibles={ciudadesDisponibles}
              />
            </div>

            {/* Contenido principal */}
            <div className="space-y-6">
              {/* Mobile filter trigger */}
              <div className="lg:hidden">
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtros{filtrosActivosCount > 0 ? ` (${filtrosActivosCount})` : ""}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] sm:w-[380px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FiltrosMercadoSticky
                        value={filtros}
                        onChange={setFiltros}
                        ciudadesDisponibles={ciudadesDisponibles}
                        sticky={false}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Heatmap */}
              <HeatmapMapa lotes={lotes} />

              {/* Header de resultados */}
              <ResultadosHeader
                total={lotes.length}
                filtros={filtros}
                onRemoveFiltro={removeFiltro}
                orden={orden}
                onOrdenChange={setOrden}
              />

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-xl" />
                  ))}
                </div>
              ) : lotes.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <Loader2 className="h-5 w-5 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground">
                    No hay activos que coincidan con los filtros actuales.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {lotesPaginados.map((l) => (
                      <TarjetaLote key={l.lote_id} lote={l} />
                    ))}
                  </div>
                  <PaginacionMercado
                    total={lotes.length}
                    currentPage={page}
                    pageSize={PAGE_SIZE}
                    onChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* CTA dual */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-8">
              <h2 className="font-heading text-xl font-bold text-secondary mb-2">
                ¿Tienes un lote?
              </h2>
              <p className="text-muted-foreground mb-6">
                Publica gratis y descubre su valor real con un diagnóstico jurídico, técnico y comercial.
              </p>
              <Button asChild size="lg">
                <Link to="/bienvenida?rol=propietario">Publicar mi lote →</Link>
              </Button>
            </div>
            <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-8">
              <h2 className="font-heading text-xl font-bold text-secondary mb-2">
                ¿Eres desarrollador?
              </h2>
              <p className="text-muted-foreground mb-6">
                Crea tu cuenta para acceder a información detallada de cada lote.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link to="/bienvenida?rol=desarrollador">Crear cuenta →</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Mercado;
