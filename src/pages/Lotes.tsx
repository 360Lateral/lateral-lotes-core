import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import Navbar from "@/components/Navbar";

import LotesFilterPanel from "@/components/LotesFilterPanel";
import LoteListCard from "@/components/LoteListCard";
import { Button } from "@/components/ui/button";
import { List, Map as MapIcon, Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

export interface Filters {
  ciudad: string;
  usoSuelo: string;
  estado: string;
  areaMin: string;
  areaMax: string;
}

const defaultFilters: Filters = {
  ciudad: "Medellín",
  usoSuelo: "Todos",
  estado: "Todos",
  areaMin: "",
  areaMax: "",
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const Lotes = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showList, setShowList] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [hoveredLoteId, setHoveredLoteId] = useState<string | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteWithPrecio | null>(null);
  const [searchText, setSearchText] = useState("");
  const [mapCenter, setMapCenter] = useState(MEDELLIN_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const initAutocomplete = useCallback(() => {
    const input = document.getElementById("google-places-search") as HTMLInputElement;
    if (!input || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: "co" },
      fields: ["geometry", "name", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      setMapZoom(15);
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }
      setSearchText(place.formatted_address || place.name || "");
    });

    autocompleteRef.current = autocomplete;
  }, []);


  const { data: allLotes = [], isLoading } = useQuery({
    queryKey: ["lotes-mapa"],
    queryFn: async () => {
      const { data: lotesData, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, barrio, ciudad, area_total_m2, estado_disponibilidad, lat, lng, score_juridico, score_normativo, score_servicios");
      if (error) throw error;

      const ids = lotesData.map((l) => l.id);
      const { data: preciosData } = await supabase
        .from("precios")
        .select("lote_id, precio_m2_cop")
        .in("lote_id", ids);

      const precioMap = new Map(preciosData?.map((p) => [p.lote_id, p.precio_m2_cop]) ?? []);

      return lotesData.map((l) => ({
        ...l,
        precio_m2: precioMap.get(l.id) ?? 0,
      })) as LoteWithPrecio[];
    },
  });

  const filteredLotes = useMemo(() => {
    return allLotes.filter((l) => {
      if (filters.ciudad !== "Todos" && l.ciudad && l.ciudad !== filters.ciudad) return false;
      if (filters.estado !== "Todos" && l.estado_disponibilidad !== filters.estado) return false;
      if (filters.areaMin && (l.area_total_m2 ?? 0) < Number(filters.areaMin)) return false;
      if (filters.areaMax && (l.area_total_m2 ?? 0) > Number(filters.areaMax)) return false;
      return true;
    });
  }, [allLotes, filters]);

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
    setFilters(defaultFilters);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Navbar />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Map */}
        <div className={`relative ${isMobile ? "h-full w-full" : "h-full w-[60%]"}`}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <input
                id="google-places-search"
                type="text"
                placeholder="Buscar por dirección, barrio o municipio..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-full border border-border bg-background pl-9 pr-9 py-2.5 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchText && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchText("");
                    setMapCenter(MEDELLIN_CENTER);
                    setMapZoom(12);
                    const input = document.getElementById("google-places-search") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
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
                      path: 0, // google.maps.SymbolPath.CIRCLE
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
                  <div style={{ fontFamily: "Montserrat, sans-serif", padding: "4px 0" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{selectedLote.nombre_lote}</p>
                    <p style={{ fontSize: 12, color: "#666", margin: "0 0 2px" }}>Área: {(selectedLote.area_total_m2 ?? 0).toLocaleString("es-CO")} m²</p>
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
                <p className="py-8 text-center font-body text-sm text-muted-foreground">
                  No se encontraron lotes con estos filtros.
                </p>
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
