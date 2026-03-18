import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import HeroImage from "@/components/ui/HeroImage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DIAGNOSTICO_IMG = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=85";

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

const serviciosOptions = ["Agua", "Energía", "Gas", "Alcantarillado", "Ninguno"];

const Diagnostico = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estimation fields
  const [municipio, setMunicipio] = useState("");
  const [area, setArea] = useState("");
  const [tipo, setTipo] = useState<TipoLote | "">("");
  const [loading, setLoading] = useState(false);
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null);
  const [searched, setSearched] = useState(false);

  // Extended form fields
  const [departamento, setDepartamento] = useState("");
  const [escritura, setEscritura] = useState("");
  const [problemaJuridico, setProblemaJuridico] = useState("");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [objetivo, setObjetivo] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleToggleServicio = (s: string) => {
    if (s === "Ninguno") {
      setServiciosSeleccionados((prev) =>
        prev.includes("Ninguno") ? [] : ["Ninguno"]
      );
      return;
    }
    setServiciosSeleccionados((prev) => {
      const without = prev.filter((x) => x !== "Ninguno");
      return without.includes(s)
        ? without.filter((x) => x !== s)
        : [...without, s];
    });
  };

  const handleSubmitDiagnostico = async () => {
    if (!nombre.trim() || !email.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y email son obligatorios.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("diagnosticos").insert({
        ciudad: municipio.trim() || null,
        departamento: departamento.trim() || null,
        area_m2: area ? Number(area) : null,
        tipo_lote: tipo || null,
        tiene_escritura: escritura === "si" ? true : escritura === "no" ? false : null,
        problema_juridico: problemaJuridico || null,
        servicios: serviciosSeleccionados.length > 0 ? serviciosSeleccionados : null,
        objetivo: objetivo || null,
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim() || null,
        estado: "nuevo",
      } as any);
      if (error) throw error;
      toast({
        title: "¡Diagnóstico recibido!",
        description: "En menos de 24 horas tendrás tu reporte en el email registrado.",
      });
      // Reset extended fields
      setDepartamento("");
      setEscritura("");
      setProblemaJuridico("");
      setServiciosSeleccionados([]);
      setObjetivo("");
      setNombre("");
      setEmail("");
      setTelefono("");
      setTimeout(() => { navigate("/"); }, 2000);
    } catch {
      toast({ title: "Error", description: "No se pudo enviar el diagnóstico. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const areaNum = Number(area) || 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroImage imageUrl={DIAGNOSTICO_IMG} height="220px" overlay="dark">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Diagnóstico 360°
            </h1>
            <p className="text-white/70">
              Obtén una estimación referencial del valor de tu lote basada en datos reales de mercado.
            </p>
          </div>
        </HeroImage>

        <div className="mx-auto max-w-2xl px-4 py-12 lg:py-20">
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

                    <div className="mt-6 flex flex-col gap-3">
                      <Button
                        className="w-full bg-orange hover:bg-orange/90 text-white"
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                      >
                        Quiero la Resolutoría completa
                      </Button>
                      <p className="text-white/50 text-xs text-center">
                        Análisis de 8 áreas + Teaser Financiero desde 4 SMLMV
                      </p>
                    </div>
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

          {/* Extended form — Solicitar diagnóstico */}
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="font-heading text-xl font-bold text-secondary mb-2">
              ¿Quieres que el equipo 360 Lateral analice tu lote?
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Déjanos tus datos:
            </p>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Input
                  id="departamento"
                  placeholder="Ej: Antioquia"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>¿Tiene escritura pública?</Label>
                <Select value={escritura} onValueChange={setEscritura}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>¿Conoce algún problema jurídico?</Label>
                <Select value={problemaJuridico} onValueChange={setProblemaJuridico}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="no_seguro">No estoy seguro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Servicios disponibles</Label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {serviciosOptions.map((s) => (
                    <label key={s} className="flex items-center gap-2 font-body text-sm cursor-pointer">
                      <Checkbox
                        checked={serviciosSeleccionados.includes(s)}
                        onCheckedChange={() => handleToggleServicio(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>¿Cuál es tu objetivo?</Label>
                <Select value={objetivo} onValueChange={setObjetivo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vender">Vender</SelectItem>
                    <SelectItem value="desarrollar">Desarrollar</SelectItem>
                    <SelectItem value="conocer_valor">Conocer su valor</SelectItem>
                    <SelectItem value="buscar_socio">Buscar socio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input
                  id="nombre"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diag-email">Email *</Label>
                <Input
                  id="diag-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diag-telefono">Teléfono (opcional)</Label>
                <Input
                  id="diag-telefono"
                  type="tel"
                  placeholder="Ej: 300 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  maxLength={20}
                />
              </div>

              <Button
                onClick={handleSubmitDiagnostico}
                disabled={submitting || !nombre.trim() || !email.trim()}
                className="w-full bg-orange hover:bg-orange/90 text-white"
                size="lg"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Solicitar mi Diagnóstico Gratuito
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Diagnostico;
