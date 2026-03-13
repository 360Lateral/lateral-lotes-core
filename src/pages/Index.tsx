import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoteCard from "@/components/LoteCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: lotes, isLoading } = useQuery({
    queryKey: ["lotes-destacados"],
    queryFn: async () => {
      // Fetch featured lotes with their latest price
      const { data: lotesData, error } = await supabase
        .from("lotes")
        .select("id, nombre_lote, barrio, area_total_m2, estado_disponibilidad, destacado, lat, lng")
        .eq("destacado", true)
        .limit(6);

      if (error) throw error;

      // Fetch prices for these lotes
      const ids = lotesData.map((l) => l.id);
      const { data: preciosData } = await supabase
        .from("precios")
        .select("lote_id, precio_m2_cop")
        .in("lote_id", ids);

      const precioMap = new Map(
        preciosData?.map((p) => [p.lote_id, p.precio_m2_cop]) ?? []
      );

      return lotesData.map((l) => ({
        ...l,
        precio_m2: precioMap.get(l.id) ?? 0,
      }));
    },
  });

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

      {/* Lotes destacados */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="mb-8 font-body text-2xl font-bold text-carbon">
          Lotes disponibles en Medellín
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-lg border border-gray-light bg-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lotes?.map((lote) => (
              <LoteCard
                key={lote.id}
                id={lote.id}
                nombre={lote.nombre_lote}
                barrio={lote.barrio ?? ""}
                area_m2={Number(lote.area_total_m2) || 0}
                precio_m2={Number(lote.precio_m2) || 0}
                estado={lote.estado_disponibilidad}
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
