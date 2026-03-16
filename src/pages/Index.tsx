import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoteCard from "@/components/LoteCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, X } from "lucide-react";

const Index = () => {
  // Filters
  const [ciudad, setCiudad] = useState<string>("todas");
  const [uso, setUso] = useState<string>("todos");
  const [areaMin, setAreaMin] = useState<string>("");
  const [areaMax, setAreaMax] = useState<string>("");

  const { data: lotes, isLoading } = useQuery({
    queryKey: ["lotes-home"],
    queryFn: async () => {
      const { data: lotesData, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, barrio, ciudad, area_total_m2, estado_disponibilidad, destacado, lat, lng, score_juridico, score_normativo, score_servicios");

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
    return lotes.filter((l) => {
      if (ciudad !== "todas" && l.ciudad !== ciudad) return false;
      if (uso !== "todos" && l.uso_principal !== uso) return false;
      const area = Number(l.area_total_m2) || 0;
      if (areaMin && area < Number(areaMin)) return false;
      if (areaMax && area > Number(areaMax)) return false;
      return true;
    });
  }, [lotes, ciudad, uso, areaMin, areaMax]);

  const hasActiveFilters = ciudad !== "todas" || uso !== "todos" || areaMin !== "" || areaMax !== "";

  const clearFilters = () => {
    setCiudad("todas");
    setUso("todos");
    setAreaMin("");
    setAreaMax("");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex min-h-[500px] flex-col items-center justify-center bg-secondary px-4 text-center">
        <h1 className="max-w-3xl font-body text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl">
          Visor Estratégico Lotes
        </h1>
        <p className="mt-4 max-w-xl font-body text-base text-gray-light md:text-lg">
          Accede a los mejores predios con información técnica, normativa y financiera completa
        </p>
        <Button variant="hero" size="xl" className="mt-8" asChild>
          <Link to="/lotes">Explorar lotes</Link>
        </Button>
      </section>

      {/* Lotes con filtros */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-body text-2xl font-bold text-carbon">
            Lotes disponibles
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Mostrando {filteredLotes.length} de {lotes?.length ?? 0} lotes
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-8 rounded-lg border border-gray-light bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-orange" />
            <span className="font-body text-sm font-semibold text-carbon">Filtros</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ml-auto flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-carbon">
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
              <div key={i} className="h-80 animate-pulse rounded-lg border border-gray-light bg-muted" />
            ))}
          </div>
        ) : filteredLotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-light py-16">
            <p className="font-body text-lg font-semibold text-carbon">No se encontraron lotes</p>
            <p className="mt-1 font-body text-sm text-muted-foreground">Intenta ajustar los filtros</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
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
