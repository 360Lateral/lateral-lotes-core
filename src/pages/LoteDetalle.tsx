import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLoteDetalle } from "@/hooks/useLoteDetalle";
import { useMiSolicitudParaLote } from "@/hooks/useMiSolicitudParaLote";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MapPin,
  Building2,
  Ruler,
  FileText,
  TrendingUp,
  Mail,
  ArrowLeft,
  ShieldCheck,
  FileSignature,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeccionBloqueada from "@/components/lotes/SeccionBloqueada";
import NdaModal from "@/components/lotes/NdaModal";
import SolicitarContactoDialog from "@/components/lotes/SolicitarContactoDialog";
import PayPerViewCTA from "@/components/lotes/PayPerViewCTA";
import { formatearCategoriaArea, formatearRangoPrecio } from "@/lib/mercado-format";

const formatCOP = (n: number | undefined | null) =>
  n == null ? "—" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const LoteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useLoteDetalle(id);
  const { data: miSolicitud } = useMiSolicitudParaLote(id);
  const [ndaOpen, setNdaOpen] = useState(false);
  const [contactoOpen, setContactoOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
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
            <Link to="/mercado"><ArrowLeft className="mr-2 h-4 w-4" />Volver al mercado</Link>
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {id && (
        <NdaModal open={ndaOpen} onOpenChange={setNdaOpen} loteId={id} />
      )}

      {id && data && (
        <SolicitarContactoDialog
          open={contactoOpen}
          onOpenChange={setContactoOpen}
          loteId={id}
          codigoAnonimo={data.codigo_anonimo}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <Link to="/mercado" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al mercado
        </Link>

        {/* Vista admin/propietario badge */}
        {(data.es_propietario || data.es_admin) && (
          <Badge variant="secondary" className="text-xs">
            <ShieldCheck className="h-3 w-3 mr-1" />
            {data.es_propietario ? "Vista de propietario" : "Vista admin"}
          </Badge>
        )}

        {/* Hero */}
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <p className="font-mono text-3xl md:text-4xl font-bold text-secondary">
                {data.nombre_lote ?? data.codigo_anonimo}
              </p>
              {data.nombre_lote && (
                <p className="text-xs text-muted-foreground font-mono mt-1">{data.codigo_anonimo}</p>
              )}
              <p className="text-base text-muted-foreground flex items-center gap-1.5 mt-2">
                <MapPin className="h-4 w-4" />
                {[data.ciudad, data.barrio].filter(Boolean).join(" · ") || "Ubicación no especificada"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{formatearCategoriaArea(data.categoria_area)}</Badge>
              <Badge variant="secondary">{formatearRangoPrecio(data.rango_precio)}</Badge>
              {data.tipo_lote && <Badge variant="outline">{data.tipo_lote}</Badge>}
            </div>
          </div>
        </Card>

        {/* Vista general — siempre visible */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Vista general
          </h2>
          <Card className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Ciudad</p>
              <p className="font-medium">{data.ciudad ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categoría de área</p>
              <p className="font-medium">{formatearCategoriaArea(data.categoria_area)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rango de precio</p>
              <p className="font-medium">{formatearRangoPrecio(data.rango_precio)}</p>
            </div>
          </Card>
        </section>

        {/* Datos básicos (básico+) */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Datos básicos del lote
          </h2>
          {verBasico ? (
            <Card className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Área total</p>
                <p className="font-medium">{data.area_total_m2 ? `${data.area_total_m2.toLocaleString("es-CO")} m²` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estrato</p>
                <p className="font-medium">{data.estrato ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{data.tipo_lote_detallado ?? data.tipo_lote ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zona aprox.</p>
                <p className="font-medium text-sm">
                  {data.lat_zona && data.lng_zona ? `${data.lat_zona}, ${data.lng_zona}` : "—"}
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

        {/* Dirección y ficha jurídica (profesional+ con NDA) */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Dirección y ficha jurídica
          </h2>
          {verProfesional ? (
            <Card className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
              {data.foto_url && (
                <img
                  src={data.foto_url}
                  alt={`Foto del lote ${data.codigo_anonimo}`}
                  className="w-full max-h-96 object-cover rounded-md border"
                  loading="lazy"
                />
              )}
            </Card>
          ) : necesitaFirmarNdaProfesional || necesitaFirmarNdaPremium ? (
            <Card className="p-6 border-dashed bg-muted/30 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSignature className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Firma el NDA para ver el detalle</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Para ver dirección, matrícula y fotos reales debes firmar el acuerdo de
                  confidencialidad con 360Lateral.
                </p>
              </div>
              <Button onClick={() => setNdaOpen(true)}>
                Firmar NDA y ver detalle
              </Button>
            </Card>
          ) : (
            <SeccionBloqueada
              nivelRequerido="profesional"
              nivelActual={nivel}
              tipo="dirección exacta, matrícula y fotos reales"
              mostrarBotonContacto
              anonimo={anonimo}
            />
          )}
        </section>

        {/* Análisis 360 y precio (premium con NDA) */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análisis 360 y precio
          </h2>
          {verPremium ? (
            <Card className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Precio estimado de venta</p>
                <p className="text-2xl font-semibold text-primary">{formatCOP(data.precio_venta_estimado)}</p>
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
                  {data.tiene_analisis_arquitectonico && <Badge variant="secondary">Arquitectónico</Badge>}
                  {data.tiene_analisis_financiero && <Badge variant="secondary">Financiero</Badge>}
                  {data.tiene_analisis_geotecnico && <Badge variant="secondary">Geotécnico</Badge>}
                  {data.tiene_analisis_mercado && <Badge variant="secondary">Mercado</Badge>}
                  {data.tiene_analisis_sspp && <Badge variant="secondary">Servicios públicos</Badge>}
                  {!data.tiene_analisis_juridico &&
                    !data.tiene_analisis_ambiental &&
                    !data.tiene_analisis_arquitectonico &&
                    !data.tiene_analisis_financiero &&
                    !data.tiene_analisis_geotecnico &&
                    !data.tiene_analisis_mercado &&
                    !data.tiene_analisis_sspp && (
                      <p className="text-sm text-muted-foreground">Sin análisis cargados todavía.</p>
                    )}
                </div>
              </div>
            </Card>
          ) : nivel === "premium" && !tieneNda ? (
            <Card className="p-6 border-dashed bg-muted/30 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSignature className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold">Firma el NDA para ver análisis y precio</h3>
              <Button onClick={() => setNdaOpen(true)}>Firmar NDA</Button>
            </Card>
          ) : (
            <SeccionBloqueada
              nivelRequerido="premium"
              nivelActual={nivel}
              tipo="precio exacto y análisis 360"
              mostrarBotonContacto
              anonimo={anonimo}
            />
          )}
        </section>

        {/* Solicitar contacto */}
        {["profesional", "premium"].includes(nivel) &&
          tieneNda &&
          !data.es_propietario &&
          !data.es_admin && (
            <Card className="p-6 bg-primary/5 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">¿Te interesa este lote?</h3>
                <p className="text-sm text-muted-foreground">
                  Solicita contacto con el propietario mediado por 360Lateral.
                </p>
              </div>
              {miSolicitud?.estado === "pendiente" ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button disabled>
                          <Mail className="mr-2 h-4 w-4" />
                          Solicitud pendiente
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Ya tienes una solicitud pendiente para este lote. 360Lateral se pondrá en
                      contacto pronto.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button onClick={() => setContactoOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Solicitar contacto
                </Button>
              )}
            </Card>
          )}
      </div>

      <Footer />
    </div>
  );
};

export default LoteDetalle;
