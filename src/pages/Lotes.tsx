import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";

import LotesFilterPanel from "@/components/LotesFilterPanel";
import LoteListCard from "@/components/LoteListCard";
import { Button } from "@/components/ui/button";
import { List, Map as MapIcon, Search, X, MapPin, FilterX } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersistedState } from "@/hooks/usePersistedState";
import MapErrorBoundary, { MapFallback } from "@/components/maps/MapErrorBoundary";
import { useGoogleMapsAuthStatus } from "@/hooks/useGoogleMapsAuthStatus";
import { formatCOP, formatMetros } from "@/lib/format-moneda";

const MEDELLIN_CENTER = { lat: 6.2530, lng: -75.5736 };

const PIN_COLORS: Record<string, string> = {
  Disponible: "#22C55E",
  Reservado: "#F59E0B",
  Vendido: "#9CA3AF",
};

export interface LoteWithPrecio {
  id: string;
  nombre_lote: string;
  barrio: string | null;
  ciudad: string | null;
  area_total_m2: number | null;
  estado_disponibilidad: string;
  lat: number | null;
  lng: number | null;
  precio_m2: number;
  score_juridico: number | null;
  score_normativo: number | null;
  score_servicios: number | null;
  created_at: string | null;
}

export interface Filters {
  ciudad: string;
  usoSuelo: string;
  estado: string;
  areaMin: string;
  areaMax: string;
}

const defaultFilters: Filters = {
  ciudad: "Todos",
  usoSuelo: "Todos",
  estado: "Todos",
  areaMin: "",
  areaMax: "",
};

const Lotes = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showList, setShowList] = useState(false);
  const mapsAuthFailed = useGoogleMapsAuthStatus();
  const [filters, setFilters, clearFiltersStorage] = usePersistedState<Filters>("lotes", defaultFilters);
  const [hoveredLoteId, setHoveredLoteId] = useState<string | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteWithPrecio | null>(null);
  const [searchText, setSearchText] = useState("");
  const [mapCenter, setMapCenter] = useState(MEDELLIN_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const irALote = useCallback((l: LoteWithPrecio) => {
    setSearchText(l.nombre_lote);
    setSearchOpen(false);
    setSelectedLote(l);
    if (l.lat != null && l.lng != null) {
      setMapCenter({ lat: l.lat, lng: l.lng });
      setMapZoom(16);
      mapRef.current?.panTo({ lat: l.lat, lng: l.lng });
      mapRef.current?.setZoom(16);
    }
  }, []);

  const { data: allLotes = [], isLoading } = useQuery({
    queryKey: ["lotes-mapa"],
    queryFn: async () => {
      const { data: lotesData, error } = await (supabase as any).rpc("listar_catalogo_lotes");
      if (error) throw error;

      return ((lotesData ?? []) as any[]).map((l) => ({
        ...l,
        precio_m2: l.precio_m2 ?? 0,
      })) as LoteWithPrecio[];
    },
  });


  const filteredLotes = useMemo(() => {
    return allLotes.filter((l) => {
      if (filters.ciudad !== "Todos" && l.ciudad && l.ciudad !== filters.ciudad) return false;
      if (filters.estado !== "Todos" && l.estado_disponibilidad !== filters.estado) return false;
      if (filters.areaMin && (l.area_total_m2 ?? 0) < Number(filters.areaMin)) return false;
      if (filters.areaMax && (l.area_total_m2 ?? 0) > Number(filters.areaMax)) return false;
      if (searchText.trim()) {
        const q = normalizar(searchText.trim());
        if (!normalizar([l.nombre_lote, l.barrio, l.ciudad].filter(Boolean).join(" ")).includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLotes, filters, searchText]);

  const sugerencias = useMemo(() => (searchOpen && searchText.trim() ? filteredLotes.slice(0, 6) : []), [searchOpen, searchText, filteredLotes]);

  const mapOptions = useMemo(() => ({
    mapTypeId: "hybrid",
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  }), []);

  const handleApplyFilters = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    clearFiltersStorage();
  }, [clearFiltersStorage]);

  return (
    <div className="flex h-screen flex-col">
      <Seo
        title="Catálogo de lotes disponibles | 360Lateral"
        description="Explora lotes urbanos y rurales en Colombia con mapa, filtros por área, ciudad y precio por m², y diagnóstico normativo 360Lateral."
        path="/lotes"
      />
      <Navbar />
      <h1 className="sr-only">Catálogo de lotes disponibles en Colombia</h1>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Map */}
        <div className={`relative ${isMobile ? "h-full w-full" : "h-full w-[60%]"}`}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <input
                id="lotes-search"
                type="text"
                autoComplete="off"
                aria-label="Buscar lotes"
                placeholder="Buscar lote por nombre, barrio o municipio..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                className="w-full rounded-full border border-border bg-background pl-9 pr-9 py-2.5 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchText && (
                <button
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchText("");
                    setMapCenter(MEDELLIN_CENTER);
                    setMapZoom(12);
                    setSelectedLote(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {searchOpen && searchText.trim() && (
                <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  {sugerencias.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No hay lotes listados que coincidan.</p>
                  ) : (
                    sugerencias.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => irALote(l)}
                        className="flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-muted"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{l.nombre_lote}</span>
                          <span className="block truncate text-xs text-muted-foreground">{[l.barrio, l.ciudad].filter(Boolean).join(", ")}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          {mapsAuthFailed ? (
            <MapFallback />
          ) : (
            <MapErrorBoundary>
              <GoogleMapsGate
                fallback={
                  <div className="flex h-full items-center justify-center bg-muted">
                    <p className="text-muted-foreground">Cargando mapa…</p>
                  </div>
                }
              >
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={mapZoom}
                  options={mapOptions}
                  onLoad={(map) => { mapRef.current = map; }}
                >
                  {filteredLotes
                    .filter((l) => l.lat != null && l.lng != null)
                    .map((lote) => (
                      <Marker
                        key={lote.id}
                        position={{ lat: lote.lat!, lng: lote.lng! }}
                        icon={{
                          path: 0,
                          fillColor: PIN_COLORS[lote.estado_disponibilidad] ?? "#9CA3AF",
                          fillOpacity: 1,
                          strokeColor: "#FFFFFF",
                          strokeWeight: 3,
                          scale: hoveredLoteId === lote.id ? 12 : 8,
                        }}
                        onClick={() => setSelectedLote(lote)}
                        zIndex={hoveredLoteId === lote.id ? 10 : 1}
                      />
                    ))}
                  {selectedLote && selectedLote.lat && selectedLote.lng && (
                    <InfoWindow
                      position={{ lat: selectedLote.lat, lng: selectedLote.lng }}
                      onCloseClick={() => setSelectedLote(null)}
                    >
                      <div style={{ fontFamily: "Raleway, sans-serif", padding: "4px 0" }}>
                        <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{selectedLote.nombre_lote}</p>
                        <p style={{ fontSize: 12, color: "#666", margin: "0 0 2px" }}>Área: {formatMetros(selectedLote.area_total_m2 ?? 0)}</p>
                        <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>Precio/m²: {formatCOP(selectedLote.precio_m2)}</p>
                        <a
                          href={`/lotes/${selectedLote.id}`}
                          style={{ display: "inline-block", background: "hsl(37,91%,52%)", color: "white", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                        >
                          Ver ficha
                        </a>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </GoogleMapsGate>
            </MapErrorBoundary>
          )}
        </div>

        {/* Desktop panel */}
        {!isMobile && (
          <div className="flex h-full w-[40%] flex-col overflow-y-auto border-l border-border bg-background">
            <LotesFilterPanel
              filters={filters}
              totalCount={allLotes.length}
              filteredCount={filteredLotes.length}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />

            <div className="flex flex-col gap-3 px-4 pb-6">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
                  ))
                : filteredLotes.map((lote) => (
                    <LoteListCard
                      key={lote.id}
                      lote={lote}
                      onMouseEnter={() => setHoveredLoteId(lote.id)}
                      onMouseLeave={() => setHoveredLoteId(null)}
                      onClick={() => navigate(`/lotes/${lote.id}`)}
                    />
                  ))}
              {!isLoading && filteredLotes.length === 0 && (
                <div className="py-10 text-center px-4">
                  <FilterX className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="font-body text-sm font-semibold text-foreground">
                    {allLotes.length === 0
                      ? "Aún no hay lotes publicados en el marketplace."
                      : `Ninguno de los ${allLotes.length} lotes disponibles coincide con tus filtros`}
                  </p>
                  {allLotes.length > 0 && (
                    <>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Prueba con criterios menos específicos.
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={handleClearFilters}>
                        <FilterX className="h-4 w-4 mr-1.5" />
                        Limpiar todos los filtros
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile floating button */}
        {isMobile && !showList && (
          <Button
            variant="default"
            size="lg"
            className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 shadow-lg"
            onClick={() => setShowList(true)}
          >
            <List className="mr-2 h-4 w-4" />
            Ver lista
          </Button>
        )}

        {/* Mobile list sheet */}
        {isMobile && showList && (
          <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-background">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <span className="font-body text-sm font-semibold text-foreground">
                {filteredLotes.length} lotes
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowList(false)}>
                <MapIcon className="mr-1 h-4 w-4" /> Ver mapa
              </Button>
            </div>

            <LotesFilterPanel
              filters={filters}
              totalCount={allLotes.length}
              filteredCount={filteredLotes.length}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />

            <div className="flex flex-col gap-3 px-4 pb-6">
              {filteredLotes.map((lote) => (
                <LoteListCard
                  key={lote.id}
                  lote={lote}
                  onClick={() => navigate(`/lotes/${lote.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lotes;
