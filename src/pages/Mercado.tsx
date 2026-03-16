import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MunicipioStats {
  ciudad: string;
  count: number;
  min: number;
  max: number;
  avg: number;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const Mercado = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["mercado-index"],
    queryFn: async () => {
      // Fetch lotes with their precios
      const { data: lotes } = await supabase
        .from("lotes")
        .select("id, ciudad")
        .eq("es_publico", true)
        .not("ciudad", "is", null);

      if (!lotes || lotes.length === 0) return [];

      const loteIds = lotes.map((l) => l.id);

      const { data: precios } = await supabase
        .from("precios")
        .select("lote_id, precio_m2_cop")
        .in("lote_id", loteIds)
        .not("precio_m2_cop", "is", null);

      if (!precios || precios.length === 0) return [];

      // Build ciudad → lote_id map
      const loteMap = new Map<string, string>();
      lotes.forEach((l) => {
        if (l.ciudad) loteMap.set(l.id, l.ciudad);
      });

      // Group precios by ciudad
      const groups = new Map<string, number[]>();
      precios.forEach((p) => {
        const ciudad = loteMap.get(p.lote_id);
        if (!ciudad) return;
        const key = ciudad.trim().toLowerCase();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(Number(p.precio_m2_cop));
      });

      const result: MunicipioStats[] = [];
      groups.forEach((values, key) => {
        const ciudad = lotes.find(
          (l) => l.ciudad?.trim().toLowerCase() === key
        )?.ciudad ?? key;
        result.push({
          ciudad,
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        });
      });

      return result.sort((a, b) => b.count - a.count);
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 lg:py-20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-secondary">
              Índice de Mercado
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Precios de referencia por m² en cada municipio, basados en lotes
            publicados en la plataforma.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !stats || stats.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">
              Aún no hay datos de mercado disponibles.
            </p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary text-secondary-foreground">
                    <TableHead className="text-secondary-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Municipio
                      </div>
                    </TableHead>
                    <TableHead className="text-secondary-foreground font-semibold text-right">
                      Mín / m²
                    </TableHead>
                    <TableHead className="text-secondary-foreground font-semibold text-right">
                      Promedio / m²
                    </TableHead>
                    <TableHead className="text-secondary-foreground font-semibold text-right">
                      Máx / m²
                    </TableHead>
                    <TableHead className="text-secondary-foreground font-semibold text-center">
                      Lotes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((s) => (
                    <TableRow key={s.ciudad}>
                      <TableCell className="font-medium">{s.ciudad}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCOP(s.min)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCOP(s.avg)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCOP(s.max)}
                      </TableCell>
                      <TableCell className="text-center">{s.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Mercado;
