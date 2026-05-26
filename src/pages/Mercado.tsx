import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import FiltrosMercado from "@/components/mercado/FiltrosMercado";
import HeatmapMapa from "@/components/mercado/HeatmapMapa";
import TarjetaAnonima from "@/components/mercado/TarjetaAnonima";
import {
  useMercadoPublico,
  type FiltrosMercado as FiltrosType,
} from "@/hooks/useMercadoPublico";

const Mercado = () => {
  const [filtros, setFiltros] = useState<FiltrosType>({});
  const { data: lotes = [], isLoading } = useMercadoPublico(filtros);

  // Para poblar el select de ciudades, hacemos una consulta sin filtros (base)
  const { data: baseLotes = [] } = useMercadoPublico({});
  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>();
    baseLotes.forEach((l) => l.ciudad && set.add(l.ciudad));
    return Array.from(set).sort();
  }, [baseLotes]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12 space-y-6">
          {/* Hero */}
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-secondary">
                Mercado de activos disponibles
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Explora lotes en venta validados por 360Lateral. Información anonimizada para proteger
              la privacidad del propietario.
            </p>
          </div>

          {/* Filtros */}
          <FiltrosMercado
            value={filtros}
            onChange={setFiltros}
            ciudadesDisponibles={ciudadesDisponibles}
          />

          {/* Heatmap */}
          <HeatmapMapa lotes={lotes} />

          {/* Resultados */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Cargando..."
                : `${lotes.length} ${lotes.length === 1 ? "activo encontrado" : "activos encontrados"}`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : lotes.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">
                No hay activos que coincidan con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lotes.map((l) => (
                <TarjetaAnonima key={l.lote_id} lote={l} />
              ))}
            </div>
          )}

          {/* CTA final */}
          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-secondary mb-2">
              ¿Eres desarrollador?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Regístrate para acceder a información detallada de los activos: normativa, análisis,
              documentos y contacto con el propietario.
            </p>
            <Button asChild size="lg">
              <Link to="/login">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Mercado;
