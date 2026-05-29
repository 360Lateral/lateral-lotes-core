import { useState } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Check, Copy, MapPin, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import MapaEstaticoLote from "@/components/lotes/MapaEstaticoLote";
import Logo from "@/components/ui/Logo";
import { useFichaLote } from "@/hooks/useFichaLote";
import { toast } from "@/hooks/use-toast";

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

const mapContainerStyle = { width: "100%", height: "100%" };
const mapOptions = {
  mapTypeId: "hybrid" as const,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const FechaHoy = () =>
  new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const Galeria = ({ fotos, fallback, nombre }: { fotos: { url: string; orden: number }[]; fallback?: string | null; nombre: string }) => {
  const lista = fotos.length > 0 ? fotos.map((f) => f.url) : fallback ? [fallback] : [];
  const [idx, setIdx] = useState(0);

  if (lista.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        Sin fotos disponibles
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + lista.length) % lista.length);
  const next = () => setIdx((i) => (i + 1) % lista.length);

  return (
    <div className="space-y-2">
      <div className="relative h-[280px] w-full overflow-hidden rounded-lg bg-muted">
        <img
          src={lista[idx]}
          alt={`${nombre} - foto ${idx + 1}`}
          className="h-full w-full object-cover"
        />
        {lista.length > 1 && (
          <>
            <button
              onClick={prev}
              className="no-print absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow hover:bg-background"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="no-print absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow hover:bg-background"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 text-xs">
              {idx + 1} / {lista.length}
            </div>
          </>
        )}
      </div>
      {lista.length > 1 && (
        <div className="no-print flex gap-1 overflow-x-auto">
          {lista.map((url, i) => (
            <button
              key={url}
              onClick={() => setIdx(i)}
              className={`h-12 w-16 shrink-0 overflow-hidden rounded border-2 ${
                i === idx ? "border-primary" : "border-transparent opacity-70"
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MapaFicha = ({ lat, lng, nombre }: { lat: number; lng: number; nombre: string }) => (
  <>
    {/* Pantalla: mapa interactivo */}
    <div className="hidden print:hidden md:block h-full min-h-[280px] w-full overflow-hidden rounded-lg">
      <GoogleMapsGate fallback={<MapaEstaticoLote lat={lat} lng={lng} nombre={nombre} />}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{ lat, lng }}
          zoom={15}
          options={mapOptions}
        >
          <MarkerF position={{ lat, lng }} />
        </GoogleMap>
      </GoogleMapsGate>
    </div>
    {/* Mobile / print: mapa estático */}
    <div className="block md:hidden print:block h-[220px] w-full overflow-hidden rounded-lg print:h-[200px]">
      <MapaEstaticoLote lat={lat} lng={lng} nombre={nombre} />
    </div>
  </>
);

const LoteFicha = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useFichaLote(id);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiado", description: "El enlace de la ficha se copió al portapapeles." });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Cargando ficha…
      </div>
    );
  }

  if (error || !data || data.encontrada !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold">Ficha no disponible</h1>
          <p className="text-muted-foreground">El activo que buscas no existe o fue retirado.</p>
        </Card>
      </div>
    );
  }

  const analisis = [
    { label: "Jurídico", on: data.tiene_analisis_juridico },
    { label: "Ambiental", on: data.tiene_analisis_ambiental },
    { label: "Arquitectónico", on: data.tiene_analisis_arquitectonico },
    { label: "Financiero", on: data.tiene_analisis_financiero },
    { label: "Geotécnico", on: data.tiene_analisis_geotecnico },
    { label: "Mercado", on: data.tiene_analisis_mercado },
    { label: "SSPP", on: data.tiene_analisis_sspp },
  ].filter((a) => a.on);

  const ubicacion = [data.ciudad, data.barrio, data.direccion].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-muted/30 print:bg-background">
      {/* Acciones */}
      <div className="no-print sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <Logo />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copiarLink}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar link
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Descargar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Ficha */}
      <main className="mx-auto max-w-4xl px-4 py-6 print:px-0 print:py-0">
        <Card className="ficha-doc bg-card p-6 shadow-sm print:border-0 print:shadow-none md:p-10">
          {/* Encabezado */}
          <header className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
            <div className="hidden print:block">
              <Logo />
            </div>
            <div className="print:hidden">
              <Logo />
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Ficha del Activo</p>
              <p className="text-xs text-muted-foreground">Generada el <FechaHoy /></p>
            </div>
          </header>

          {/* Título y ubicación */}
          <section className="mb-6">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{data.nombre_lote}</h1>
            {ubicacion && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{ubicacion}</span>
              </p>
            )}
          </section>

          {/* Visual: fotos + mapa */}
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
            <Galeria fotos={data.fotos ?? []} fallback={data.foto_url} nombre={data.nombre_lote ?? "Lote"} />
            {data.lat != null && data.lng != null ? (
              <MapaFicha lat={Number(data.lat)} lng={Number(data.lng)} nombre={data.nombre_lote ?? "Lote"} />
            ) : (
              <div className="flex h-full min-h-[280px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                Sin coordenadas
              </div>
            )}
          </section>

          {/* Datos del activo */}
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Datos del activo</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <DatoCard label="Área total" value={data.area_total_m2 ? `${Number(data.area_total_m2).toLocaleString("es-CO")} m²` : "—"} />
              <DatoCard label="Uso / tipo" value={data.tipo_lote ?? "—"} />
              <DatoCard label="Ciudad" value={data.ciudad ?? "—"} />
              {data.barrio && <DatoCard label="Sector" value={data.barrio} />}
              {data.publicado_venta && data.precio_venta_estimado != null && (
                <DatoCard label="Precio" value={formatCOP(Number(data.precio_venta_estimado))} highlight />
              )}
              {data.propietario_nombre && (
                <DatoCard label="Propietario" value={data.propietario_nombre} />
              )}
            </div>
          </section>

          {/* Análisis */}
          {analisis.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Análisis disponibles</h2>
              <div className="flex flex-wrap gap-2">
                {analisis.map((a) => (
                  <Badge key={a.label} className="ficha-badge bg-success text-primary-foreground">
                    <Check className="mr-1 h-3 w-3" /> {a.label}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Los análisis detallados están disponibles bajo solicitud a 360Lateral.
              </p>
            </section>
          )}

          {/* CTA / contacto */}
          <footer className="ficha-footer mt-10 rounded-lg border border-border bg-muted/40 p-5 text-center">
            <p className="mb-1 text-sm font-semibold text-foreground">
              Para más información sobre este activo, contacta a 360Lateral.
            </p>
            <p className="text-xs text-muted-foreground">
              contacto@urbanix360.com · urbanix360.com
            </p>
            <div className="mt-3 flex justify-center">
              <Logo />
            </div>
          </footer>
        </Card>
      </main>
    </div>
  );
};

const DatoCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div
    className={`rounded-lg border p-3 ${
      highlight ? "ficha-highlight border-primary/40 bg-primary/5" : "border-border bg-background"
    }`}
  >
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`mt-1 text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

export default LoteFicha;
