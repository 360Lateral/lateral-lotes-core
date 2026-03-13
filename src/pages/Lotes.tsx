import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LotesFilterPanel from "@/components/LotesFilterPanel";
import LoteListCard from "@/components/LoteListCard";
import { Button } from "@/components/ui/button";
import { List, Map as MapIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFjdHVyYWNpb250ZXJyYSIsImEiOiJjbW1wY3F3aGcwb2JiMnBweTJ1MnFrMWNxIn0.U5SBL1PDZLqAd4h9RDsx4w";

const MEDELLIN_CENTER: [number, number] = [-75.5736, 6.2530];

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

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const { data: allLotes = [], isLoading } = useQuery({
    queryKey: ["lotes-mapa"],
    queryFn: async () => {
      const { data: lotesData, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, barrio, ciudad, area_total_m2, estado_disponibilidad, lat, lng");
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: MEDELLIN_CENTER,
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const filteredIds = new Set(filteredLotes.map((l) => l.id));

    filteredLotes.forEach((lote) => {
      if (lote.lat == null || lote.lng == null) return;

      const color = PIN_COLORS[lote.estado_disponibilidad] ?? "#9CA3AF";

      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      el.style.transition = "transform 0.15s";
      el.dataset.loteId = lote.id;

      // Tooltip on hover
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.4)";
        el.title = lote.nombre_lote;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      // Popup on click
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        popupRef.current?.remove();
        const popup = new mapboxgl.Popup({ offset: 15, closeButton: true, maxWidth: "240px" })
          .setLngLat([lote.lng!, lote.lat!])
          .setHTML(`
            <div style="font-family:Montserrat,sans-serif;padding:4px 0;">
              <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${lote.nombre_lote}</p>
              <p style="font-size:12px;color:#666;margin:0 0 2px;">Área: ${(lote.area_total_m2 ?? 0).toLocaleString("es-CO")} m²</p>
              <p style="font-size:12px;color:#666;margin:0 0 8px;">Precio/m²: ${formatCOP(lote.precio_m2)}</p>
              <a href="/lotes/${lote.id}" style="display:inline-block;background:hsl(37,91%,52%);color:white;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">Ver ficha</a>
            </div>
          `)
          .addTo(map);
        popupRef.current = popup;
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lote.lng!, lote.lat!])
        .addTo(map);

      markersRef.current.set(lote.id, marker);
    });
  }, [filteredLotes]);

  // Highlight pin on card hover
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === hoveredLoteId) {
        el.style.transform = "scale(1.6)";
        el.style.zIndex = "10";
      } else {
        el.style.transform = "scale(1)";
        el.style.zIndex = "1";
      }
    });
  }, [hoveredLoteId]);

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
        <div
          ref={mapContainer}
          className={`${isMobile ? "h-full w-full" : "h-full w-[60%]"}`}
        />

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
