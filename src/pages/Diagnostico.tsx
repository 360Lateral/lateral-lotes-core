import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type TipoLote = "Urbano" | "Rural" | "Expansión urbana";

const tipoToUsos: Record<TipoLote, string[]> = {
  Urbano: ["residencial", "comercial", "industrial", "mixto"],
  Rural: ["rural"],
  "Expansión urbana": ["expansión", "expansion"],
};

interface Estimacion {
  min: number;
  avg: number;
  max: number;
  count: number;
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const Diagnostico = () => {
  const [municipio, setMunicipio] = useState("");
  const [area, setArea] = useState("");
  const [tipo, setTipo] = useState<TipoLote | "">("");
  const [loading, setLoading] = useState(false);
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null);
  const [searched, setSearched] = useState(false);

  const canEstimate = municipio.trim() && area && Number(area) > 0 && tipo;

  const handleEstimar = async () => {
    if (!canEstimate) return;
    setLoading(true);
    setEstimacion(null);
    setSearched(true);

    try {
      // Get lotes matching ciudad
      const { data: lotes } = await supabase
        .from("lotes")
        .select("id, ciudad")
        .ilike("ciudad", municipio.trim());

      if (!lotes || lotes.length === 0) {
        setEstimacion(null);
        setLoading(false);
        return;
      }

      const loteIds = lotes.map((l) => l.id);

      // Filter by uso_principal via normativa_urbana
      const usosTarget = tipoToUsos[tipo as TipoLote];
      const { data: normativas } = await supabase
        .from("normativa_urbana")
        .select("lote_id, uso_principal")
        .in("lote_id", loteIds);

      let filteredIds = loteIds;
      if (normativas && normativas.length > 0) {
        const matchingIds = normativas
          .filter(
            (n) =>
              n.uso_principal &&
              usosTarget.some((u) =>
                n.uso_principal!.toLowerCase().includes(u)
              )
          )
          .map((n) => n.lote_id);
        if (matchingIds.length > 0) {
          filteredIds = matchingIds;
        }
        // If no normativa matches, fall back to all lotes in that ciudad
      }

      // Get precios
      const { data: precios } = await supabase
        .from("precios")
        .select("precio_m2_cop")
        .in("lote_id", filteredIds)
        .not("precio_m2_cop", "is", null);

      if (!precios || precios.length === 0) {
        setEstimacion(null);
        setLoading(false);
        return;
      }

      const values = precios.map((p) => Number(p.precio_m2_cop));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

      setEstimacion({ min, avg, max, count: values.length });
    } catch {
      setEstimacion(null);
    } finally {
      setLoading(false);
    }
  };

  const areaNum = Number(area) || 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-12 lg:py-20">
          <h1 className="font-heading text-3xl font-bold text-secondary mb-2">
            Diagnóstico 360°
          </h1>
          <p className="text-muted-foreground mb-8">
            Obtén una estimación referencial del valor de tu lote basada en datos reales de mercado.
          </p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio</Label>
              <Input
                id="municipio"
                placeholder="Ej: Medellín, Rionegro, Envigado"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área en m²</Label>
              <Input
                id="area"
                type="number"
                min={1}
                placeholder="Ej: 500"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de lote</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoLote)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urbano">Urbano</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                  <SelectItem value="Expansión urbana">Expansión urbana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleEstimar}
              disabled={!canEstimate || loading}
              className="w-full bg-orange hover:bg-orange/90 text-white"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Ver estimación de valor
            </Button>
          </div>

          {/* Estimation card */}
          {searched && !loading && (
            <div className="mt-8 rounded-xl p-6 md:p-8" style={{ backgroundColor: "#1a2744" }}>
              {estimacion ? (
                <>
                  <h2 className="text-lg font-heading font-semibold text-white mb-4">
                    Estimación 360° — Referencia de Mercado
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <p className="text-white/70 text-sm mb-1">Precio por m² en {municipio.trim()}</p>
                      <p className="text-white text-lg">
                        Entre{" "}
                        <span style={{ color: "#E8951A" }} className="font-bold">
                          {formatCOP(estimacion.min)}
                        </span>{" "}
                        y{" "}
                        <span style={{ color: "#E8951A" }} className="font-bold">
                          {formatCOP(estimacion.max)}
                        </span>{" "}
                        por m²
                      </p>
                    </div>

                    <div>
                      <p className="text-white/70 text-sm mb-1">Estimación total de tu lote</p>
                      <p className="text-white text-lg">
                        Tu lote de{" "}
                        <span style={{ color: "#E8951A" }} className="font-bold">
                          {areaNum.toLocaleString("es-CO")} m²
                        </span>{" "}
                        podría valer entre{" "}
                        <span style={{ color: "#E8951A" }} className="font-bold">
                          {formatCOP(areaNum * estimacion.min)}
                        </span>{" "}
                        y{" "}
                        <span style={{ color: "#E8951A" }} className="font-bold">
                          {formatCOP(areaNum * estimacion.max)}
                        </span>{" "}
                        COP
                      </p>
                    </div>

                    <p className="text-white/50 text-xs mt-4">
                      Esta es una estimación referencial basada en {estimacion.count} lote
                      {estimacion.count > 1 ? "s" : ""} similar
                      {estimacion.count > 1 ? "es" : ""} en la plataforma. Para un avalúo
                      preciso, solicita tu Diagnóstico 360° completo.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-white/80 text-center py-4">
                  Aún no tenemos referencias de mercado para este municipio. Tu diagnóstico
                  será analizado por el equipo 360 Lateral.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Diagnostico;
