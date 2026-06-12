import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useLoteDetalle } from "@/hooks/useLoteDetalle";
import { useMiSolicitudParaLote } from "@/hooks/useMiSolicitudParaLote";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateVisitorSession } from "@/lib/visitor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileSignature,
  FileText,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NdaModal from "@/components/lotes/NdaModal";
import SolicitarContactoDialog from "@/components/lotes/SolicitarContactoDialog";
import PayPerViewCTA from "@/components/lotes/PayPerViewCTA";
import SeccionBloqueada from "@/components/lotes/SeccionBloqueada";
import { Score360Visualizacion } from "@/components/lotes/Score360Visualizacion";
import { MapaHeroLote } from "@/components/lotes/MapaHeroLote";
import { SidebarStickyLote } from "@/components/lotes/SidebarStickyLote";
import { GaleriaFotosLote } from "@/components/lotes/GaleriaFotosLote";
import { formatearCategoriaArea, formatearRangoPrecio } from "@/lib/mercado-format";

const formatCOP = (n: number | undefined | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

const MetricaKey = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-lg border p-3 ${
      highlight ? "bg-primary/5 border-primary/30" : "bg-card"
    }`}
  >
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
    <p className={`text-lg font-semibold mt-1 ${highlight ? "text-primary" : ""}`}>{value}</p>
  </div>
);

const SeccionBloqueadaMejorada = ({
  titulo,
  descripcion,
  icon: Icon,
  onClick,
  ctaLabel,
}: {
  titulo: string;
  descripcion: string;
  icon: LucideIcon;
  onClick: () => void;
  ctaLabel: string;
}) => (
  <Card className="p-6 border-dashed bg-muted/30 flex flex-col items-center text-center gap-3">
    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-base font-semibold max-w-md">{titulo}</h3>
    <p className="text-sm text-muted-foreground max-w-md">{descripcion}</p>
    <Button onClick={onClick}>{ctaLabel}</Button>
  </Card>
);

const LoteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useLoteDetalle(id);
  const { data: miSolicitud } = useMiSolicitudParaLote(id);
  const [ndaOpen, setNdaOpen] = useState(false);
  const [contactoOpen, setContactoOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data || data.error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-3">Este lote no está disponible</h1>
          <p className="text-muted-foreground mb-6">
            {data?.error ?? "No pudimos cargar la información del lote en este momento."}
          </p>
          <Button asChild>
            <Link to="/mercado">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al mercado
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const nivel = data.nivel_usuario;
  const accesoCompleto = !!data.acceso_completo;
  const tieneNda = data.tiene_nda_firmado;
  const anonimo = nivel === "gratuito" && !data.es_propietario && !data.es_admin;

  const verBasico = accesoCompleto || ["basico", "profesional", "premium"].includes(nivel);
  const verProfesional = accesoCompleto || (["profesional", "premium"].includes(nivel) && tieneNda);
  const verPremium = accesoCompleto || (nivel === "premium" && tieneNda);

  const necesitaFirmarNdaProfesional = !accesoCompleto && nivel === "profesional" && !tieneNda;
  const necesitaFirmarNdaPremium = !accesoCompleto && nivel === "premium" && !tieneNda;

  // Solo mostrar coordenadas exactas si tiene nivel profesional/premium con NDA
  const mostrarUbicacionExacta = verProfesional && data.lat != null && data.lng != null;
  const latMapa = mostrarUbicacionExacta ? data.lat! : data.lat_zona ?? null;
  const lngMapa = mostrarUbicacionExacta ? data.lng! : data.lng_zona ?? null;

  const scoresBloqueados = !verBasico;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {id && <NdaModal open={ndaOpen} onOpenChange={setNdaOpen} loteId={id} />}
      {id && (
        <SolicitarContactoDialog
          open={contactoOpen}
          onOpenChange={setContactoOpen}
          loteId={id}
          codigoAnonimo={data.codigo_anonimo}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <Link
          to="/mercado"
          className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al mercado
        </Link>

        {(data.es_propietario || data.es_admin) && (
          <Badge variant="secondary" className="text-xs w-fit">
            <ShieldCheck className="h-3 w-3 mr-1" />
            {data.es_propietario ? "Vista de propietario" : "Vista admin"}
          </Badge>
        )}

        {data.acceso_por_ppv && !data.es_propietario && !data.es_admin && id && (
          <PayPerViewCTA loteId={id} accesoActivoExpira={data.ppv_expira ?? undefined} />
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Columna principal */}
          <div className="space-y-6 min-w-0">
            {/* Hero card */}
            <Card className="p-5 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{data.codigo_anonimo}</p>
                  <h1 className="text-2xl md:text-3xl font-bold text-secondary mt-0.5">
                    {data.nombre_lote ?? "Lote sin nombre"}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5">
                    <MapPin className="h-4 w-4" />
                    {[data.ciudad, data.barrio].filter(Boolean).join(" · ") ||
                      "Ubicación no especificada"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatearCategoriaArea(data.categoria_area)}</Badge>
                  <Badge variant="secondary">{formatearRangoPrecio(data.rango_precio)}</Badge>
                  {data.tipo_lote && <Badge variant="outline">{data.tipo_lote}</Badge>}
                </div>
              </div>

              <MapaHeroLote lat={latMapa} lng={lngMapa} ofuscado={!mostrarUbicacionExacta} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricaKey
                  label="Área total"
                  value={
                    verBasico && data.area_total_m2
                      ? `${data.area_total_m2.toLocaleString("es-CO")} m²`
                      : formatearCategoriaArea(data.categoria_area)
                  }
                />
                <MetricaKey
                  label="Ciudad"
                  value={data.ciudad ?? "—"}
                />
                <MetricaKey
                  label="Estrato"
                  value={verBasico && data.estrato != null ? String(data.estrato) : "—"}
                />
                <MetricaKey
                  label="Score 360°"
                  value={
                    scoresBloqueados
                      ? "—"
                      : data.score_360_promedio != null
                      ? `${data.score_360_promedio.toFixed(1)}/10`
                      : "—"
                  }
                  highlight={!scoresBloqueados && (data.score_360_promedio ?? 0) >= 8}
                />
              </div>
            </Card>

            {/* Galería */}
            {verProfesional && id && (
              <GaleriaFotosLote loteId={id} fallbackUrl={data.foto_url} />
            )}

            {/* Score 360° */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Análisis 360°
              </h2>
              <Card className="p-5">
                <Score360Visualizacion
                  scoreJuridico={data.score_juridico}
                  scoreAmbiental={data.score_ambiental}
                  scoreArquitectonico={data.score_arquitectonico}
                  scoreFinanciero={data.score_financiero}
                  scoreGeotecnico={data.score_geotecnico}
                  scoreMercado={data.score_mercado}
                  scoreSspp={data.score_sspp}
                  bloqueado={scoresBloqueados}
                />
                {scoresBloqueados && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Sube a plan Básico o superior para ver los puntajes técnicos del lote.
                  </p>
                )}
              </Card>
            </section>

            {/* Datos básicos */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                Datos básicos del lote
              </h2>
              {verBasico ? (
                <Card className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Área total</p>
                    <p className="font-medium">
                      {data.area_total_m2
                        ? `${data.area_total_m2.toLocaleString("es-CO")} m²`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estrato</p>
                    <p className="font-medium">{data.estrato ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {data.tipo_lote_detallado ?? data.tipo_lote ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Zona aprox.</p>
                    <p className="font-medium text-sm">
                      {data.lat_zona && data.lng_zona
                        ? `${data.lat_zona}, ${data.lng_zona}`
                        : "—"}
                    </p>
                  </div>
                </Card>
              ) : (
                <SeccionBloqueada
                  nivelRequerido="basico"
                  nivelActual={nivel}
                  tipo="área exacta, estrato y zona aproximada"
                  anonimo={anonimo}
                />
              )}
            </section>

            {/* Dirección y ficha jurídica */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Dirección y ficha jurídica
              </h2>
              {verProfesional ? (
                <Card className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="font-medium">{data.direccion ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Matrícula inmobiliaria</p>
                    <p className="font-medium">{data.matricula ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coordenadas</p>
                    <p className="font-medium text-sm">
                      {data.lat && data.lng ? `${data.lat}, ${data.lng}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre interno</p>
                    <p className="font-medium">{data.nombre_lote ?? "—"}</p>
                  </div>
                </Card>
              ) : necesitaFirmarNdaProfesional || necesitaFirmarNdaPremium ? (
                <SeccionBloqueadaMejorada
                  icon={FileSignature}
                  titulo="Acepta el Acuerdo de Confidencialidad y No Elusión"
                  descripcion="Para ver dirección, matrícula y fotos reales debes aceptar el Acuerdo con 360Lateral, que incluye tramitar cualquier negocio sobre este activo exclusivamente a través de la plataforma."
                  onClick={() => setNdaOpen(true)}
                  ctaLabel="Ver y aceptar el acuerdo"
                />
              ) : (
                <div className="space-y-3">
                  <SeccionBloqueada
                    nivelRequerido="profesional"
                    nivelActual={nivel}
                    tipo="dirección exacta, matrícula y fotos reales"
                    mostrarBotonContacto
                    anonimo={anonimo}
                  />
                  {!anonimo && id && !data.acceso_por_ppv && (
                    <div className="flex justify-center">
                      <PayPerViewCTA loteId={id} />
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Análisis premium y precio */}
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Análisis detallado y precio
              </h2>
              {verPremium ? (
                <Card className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Precio estimado de venta</p>
                    <p className="text-2xl font-semibold text-primary">
                      {formatCOP(data.precio_venta_estimado)}
                    </p>
                  </div>
                  {data.notas && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notas del propietario</p>
                      <p className="text-sm whitespace-pre-wrap">{data.notas}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Análisis 360 disponibles</p>
                    <div className="flex flex-wrap gap-2">
                      {data.tiene_analisis_juridico && <Badge variant="secondary">Jurídico</Badge>}
                      {data.tiene_analisis_ambiental && <Badge variant="secondary">Ambiental</Badge>}
                      {data.tiene_analisis_arquitectonico && (
                        <Badge variant="secondary">Arquitectónico</Badge>
                      )}
                      {data.tiene_analisis_financiero && (
                        <Badge variant="secondary">Financiero</Badge>
                      )}
                      {data.tiene_analisis_geotecnico && (
                        <Badge variant="secondary">Geotécnico</Badge>
                      )}
                      {data.tiene_analisis_mercado && <Badge variant="secondary">Mercado</Badge>}
                      {data.tiene_analisis_sspp && (
                        <Badge variant="secondary">Servicios públicos</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ) : nivel === "premium" && !tieneNda ? (
                <SeccionBloqueadaMejorada
                  icon={FileSignature}
                  titulo="Acepta el Acuerdo de Confidencialidad para ver análisis y precio"
                  descripcion="El precio exacto y los análisis 360 están disponibles tras aceptar el Acuerdo de Confidencialidad y No Elusión."
                  onClick={() => setNdaOpen(true)}
                  ctaLabel="Ver y aceptar el acuerdo"
                />
              ) : (
                <div className="space-y-3">
                  <SeccionBloqueada
                    nivelRequerido="premium"
                    nivelActual={nivel}
                    tipo="precio exacto y análisis 360"
                    mostrarBotonContacto
                    anonimo={anonimo}
                  />
                  {!anonimo && id && !data.acceso_por_ppv && (
                    <div className="flex justify-center">
                      <PayPerViewCTA loteId={id} />
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar sticky */}
          <SidebarStickyLote
            precioEstimado={data.precio_venta_estimado ?? null}
            nivel={nivel}
            ndaFirmado={tieneNda}
            accesoCompleto={accesoCompleto}
            puedeSolicitar={
              !anonimo &&
              !data.es_propietario &&
              !data.es_admin &&
              ["profesional", "premium"].includes(nivel) &&
              tieneNda
            }
            solicitudPendiente={miSolicitud?.estado === "pendiente"}
            onSolicitarContacto={() => setContactoOpen(true)}
            onGenerarPdf={() => id && navigate(`/lotes/${id}/ficha`)}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoteDetalle;
