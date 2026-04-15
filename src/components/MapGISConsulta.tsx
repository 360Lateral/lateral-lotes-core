/**
 * MapGISConsulta — Panel para consultar datos urbanísticos de MapGIS Medellín
 *
 * Soporta 4 tipos de entrada:
 *   CBML | Matrícula inmobiliaria | Dirección | Ubicación (coordenadas)
 *
 * Al obtener resultados, permite aplicarlos directamente a normativa_urbana
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, MapPin, Search, CheckCircle, AlertTriangle,
  Building2, Leaf, TrendingUp, Layers, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Tipos ────────────────────────────────────────────────────────────────
type TipoEntrada = "cbml" | "matricula" | "direccion" | "ubicacion";

interface MapGISResult {
  cbml: string;
  clasificacion_suelo: string | null;
  es_urbano: boolean;
  uso_suelo: {
    categoria: string | null;
    subcategoria: string | null;
    codigo: string | null;
    porcentaje: string | null;
  } | null;
  aprovechamiento_urbano: {
    tratamiento: string | null;
    codigo_tratamiento: string | null;
    indice_construccion_max: string | null;
    densidad_habitacional_max: string | null;
    altura_normativa: string | null;
    identificador: string | null;
  } | null;
  restricciones: {
    amenaza_riesgo: string | null;
    retiros_rios: string;
  };
  fuente: string;
  fecha_consulta: string;
  desde_cache?: boolean;
  error?: string;
  detalle?: string;
}

interface Props {
  loteId: string;
  /** Callback para aplicar datos de MapGIS al formulario de normativa */
  onApply?: (datos: {
    uso_principal?: string;
    tratamiento?: string;
    indice_construccion?: number | null;
    altura_normativa?: string | null;
  }) => void;
}

// ─── Helpers visuales ─────────────────────────────────────────────────────
const Chip = ({ label, ok }: { label: string; ok?: boolean }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium
    ${ok === true  ? "bg-emerald-100 text-emerald-700" :
      ok === false ? "bg-rose-100 text-rose-700" :
                     "bg-muted text-muted-foreground"}`}>
    {label}
  </span>
);

// ─── Componente principal ──────────────────────────────────────────────────
const MapGISConsulta = ({ loteId, onApply }: Props) => {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<TipoEntrada>("cbml");
  const [valor, setValor] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<MapGISResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const placeholders: Record<TipoEntrada, string> = {
    cbml:       "Ej: 12070080003 (11 dígitos)",
    matricula:  "Ej: 174838",
    direccion:  "Ej: CL 50 30 20, Medellín",
    ubicacion:  "Ej: 6.2442,-75.5812 (lat,lng)",
  };

  const labels: Record<TipoEntrada, string> = {
    cbml:       "Código CBML",
    matricula:  "Matrícula inmobiliaria",
    direccion:  "Dirección",
    ubicacion:  "Coordenadas",
  };

  const consultar = async () => {
    if (!valor.trim()) {
      toast({ title: "Ingresa un valor para buscar", variant: "destructive" });
      return;
    }
    setCargando(true);
    setError(null);
    setResultado(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await supabase.functions.invoke("mapgis-consulta", {
        body: { tipo, valor: valor.trim(), lote_id: loteId },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (resp.error) throw new Error(resp.error.message);

      const data: MapGISResult = resp.data;
      if (data.error) {
        setError(`${data.error}${data.detalle ? ` — ${data.detalle}` : ""}`);
      } else {
        setResultado(data);
      }
    } catch (e: any) {
      setError(e.message || "Error al consultar MapGIS");
    } finally {
      setCargando(false);
    }
  };

  const aplicarNormativa = () => {
    if (!resultado || !onApply) return;
    onApply({
      uso_principal: resultado.uso_suelo?.categoria ?? undefined,
      tratamiento:   resultado.aprovechamiento_urbano?.tratamiento ?? undefined,
      indice_construccion:
        resultado.aprovechamiento_urbano?.indice_construccion_max
          ? parseFloat(resultado.aprovechamiento_urbano.indice_construccion_max)
          : null,
      altura_normativa: resultado.aprovechamiento_urbano?.altura_normativa ?? null,
    });
    toast({ title: "Datos aplicados", description: "Los datos de MapGIS se copiaron al formulario de normativa." });
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="font-body text-sm font-semibold text-foreground">Consulta MapGIS Medellín</h3>
        <span className="font-body text-[10px] text-muted-foreground">· Datos oficiales del POT</span>
      </div>

      {/* Tabs por tipo de búsqueda */}
      <Tabs value={tipo} onValueChange={(v) => { setTipo(v as TipoEntrada); setValor(""); setResultado(null); setError(null); }}>
        <TabsList className="h-8 text-xs">
          <TabsTrigger value="cbml"      className="text-xs px-3">CBML</TabsTrigger>
          <TabsTrigger value="matricula" className="text-xs px-3">Matrícula</TabsTrigger>
          <TabsTrigger value="direccion" className="text-xs px-3">Dirección</TabsTrigger>
          <TabsTrigger value="ubicacion" className="text-xs px-3">Coordenadas</TabsTrigger>
        </TabsList>

        {(["cbml", "matricula", "direccion", "ubicacion"] as TipoEntrada[]).map((t) => (
          <TabsContent key={t} value={t} className="mt-3">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="font-body text-xs text-muted-foreground">{labels[t]}</Label>
                <Input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder={placeholders[t]}
                  onKeyDown={(e) => e.key === "Enter" && consultar()}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={consultar}
                  disabled={cargando}
                  size="sm"
                  className="gap-1.5"
                >
                  {cargando ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  {cargando ? "Consultando..." : "Consultar"}
                </Button>
              </div>
            </div>

            {t === "direccion" && (
              <p className="mt-1.5 font-body text-[10px] text-muted-foreground">
                Usa el formato Medellín: tipo vía + número (ej: CL 50 30 20 o KR 43 5A 100)
              </p>
            )}
            {t === "ubicacion" && (
              <p className="mt-1.5 font-body text-[10px] text-muted-foreground">
                Ingresa latitud y longitud separadas por coma (ej: 6.2442,-75.5812)
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="font-body text-xs text-rose-700">{error}</p>
        </div>
      )}

      {/* Resultados */}
      {resultado && (
        <div className="space-y-3">
          {/* Header resultado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="font-body text-xs font-semibold text-foreground">
                CBML: {resultado.cbml}
              </span>
              <Chip
                label={resultado.clasificacion_suelo ?? "Sin clasificación"}
                ok={resultado.es_urbano ? true : undefined}
              />
              {resultado.desde_cache && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">desde caché</Badge>
              )}
            </div>
            {onApply && (
              <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={aplicarNormativa}>
                <TrendingUp className="h-3 w-3" />
                Aplicar a normativa
              </Button>
            )}
          </div>

          {/* Cards de datos */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* Uso del suelo */}
            <Card>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span className="font-body text-xs font-semibold">Uso del suelo</span>
                </div>
                {resultado.uso_suelo ? (
                  <div className="space-y-1 font-body text-xs text-muted-foreground">
                    <p><span className="text-foreground font-medium">Categoría:</span> {resultado.uso_suelo.categoria ?? "—"}</p>
                    <p><span className="text-foreground font-medium">Subcategoría:</span> {resultado.uso_suelo.subcategoria ?? "—"}</p>
                    {resultado.uso_suelo.porcentaje && (
                      <p><span className="text-foreground font-medium">Porcentaje:</span> {resultado.uso_suelo.porcentaje}</p>
                    )}
                    {resultado.uso_suelo.codigo && (
                      <p><span className="text-foreground font-medium">Código:</span> {resultado.uso_suelo.codigo}</p>
                    )}
                  </div>
                ) : (
                  <p className="font-body text-xs text-muted-foreground">No disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Aprovechamiento urbano */}
            <Card>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="font-body text-xs font-semibold">Aprovechamiento urbano</span>
                </div>
                {resultado.aprovechamiento_urbano ? (
                  <div className="space-y-1 font-body text-xs text-muted-foreground">
                    <p><span className="text-foreground font-medium">Tratamiento:</span> {resultado.aprovechamiento_urbano.tratamiento ?? "—"}</p>
                    <p><span className="text-foreground font-medium">IC máx:</span> {resultado.aprovechamiento_urbano.indice_construccion_max ?? "—"}</p>
                    <p><span className="text-foreground font-medium">Densidad hab.:</span> {resultado.aprovechamiento_urbano.densidad_habitacional_max ?? "—"}</p>
                    <p><span className="text-foreground font-medium">Altura normativa:</span> {resultado.aprovechamiento_urbano.altura_normativa ?? "—"}</p>
                  </div>
                ) : (
                  <p className="font-body text-xs text-muted-foreground">No disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Restricciones ambientales */}
            <Card className="sm:col-span-2">
              <CardContent className="p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-body text-xs font-semibold">Restricciones ambientales</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 font-body text-xs text-muted-foreground">
                  <div>
                    <span className="text-foreground font-medium">Amenaza / Riesgo:</span>
                    <p className="mt-0.5">
                      {resultado.restricciones.amenaza_riesgo
                        ? <span className="text-rose-600">{resultado.restricciones.amenaza_riesgo}</span>
                        : <span className="text-emerald-600">Sin amenaza reportada</span>
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground font-medium">Retiros ríos/quebradas:</span>
                    <p className="mt-0.5">
                      {resultado.restricciones.retiros_rios === "Sin restricciones"
                        ? <span className="text-emerald-600">Sin restricciones</span>
                        : <span className="text-amber-600">{resultado.restricciones.retiros_rios}</span>
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fuente */}
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 text-muted-foreground" />
            <p className="font-body text-[10px] text-muted-foreground">
              Fuente: {resultado.fuente} · {new Date(resultado.fecha_consulta).toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapGISConsulta;
