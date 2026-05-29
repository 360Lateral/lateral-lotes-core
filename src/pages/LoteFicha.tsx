import { useParams } from "react-router-dom";
import { Check, Copy, MapPin, Printer, ChevronLeft, ChevronRight, ExternalLink, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import MapaEstaticoLote from "@/components/lotes/MapaEstaticoLote";
import Logo from "@/components/ui/Logo";
import { useFichaLote, type FichaLoteData } from "@/hooks/useFichaLote";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { toast } from "@/hooks/use-toast";

const PROD_BASE = "https://urbanix360.com";

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

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
      <div className="flex h-full min-h-[250px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        Sin fotos disponibles
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + lista.length) % lista.length);
  const next = () => setIdx((i) => (i + 1) % lista.length);

  return (
    <div className="space-y-2">
      <div className="relative h-[250px] w-full overflow-hidden rounded-lg bg-muted">
        <img src={lista[idx]} alt={`${nombre} - foto ${idx + 1}`} className="h-full w-full object-cover" />
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

const generarHtmlStandalone = (ficha: FichaLoteData, mapsKey: string | undefined): string => {
  const staticMapUrl =
    ficha.lat != null && ficha.lng != null && mapsKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${ficha.lat},${ficha.lng}&zoom=15&size=600x300&scale=2&markers=color:0xF5A623%7C${ficha.lat},${ficha.lng}&key=${mapsKey}`
      : "";

  const gmapsLink =
    ficha.lat != null && ficha.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${ficha.lat},${ficha.lng}`
      : "";

  const fotosHtml = (ficha.fotos ?? [])
    .map((f) => `<img src="${f.url}" style="width:100%;border-radius:8px;margin-bottom:8px;" />`)
    .join("");

  const analisisHtml = (
    [
      ["Jurídico", ficha.tiene_analisis_juridico],
      ["Ambiental", ficha.tiene_analisis_ambiental],
      ["Arquitectónico", ficha.tiene_analisis_arquitectonico],
      ["Financiero", ficha.tiene_analisis_financiero],
      ["Geotécnico", ficha.tiene_analisis_geotecnico],
      ["Mercado", ficha.tiene_analisis_mercado],
      ["SSPP", ficha.tiene_analisis_sspp],
    ] as [string, boolean | undefined][]
  )
    .filter(([, tiene]) => tiene)
    .map(
      ([nombre]) =>
        `<span style="display:inline-block;background:#ecfdf5;color:#059669;padding:4px 10px;border-radius:99px;font-size:13px;margin:2px;">✓ ${nombre}</span>`,
    )
    .join("");

  const mapaBloque = staticMapUrl
    ? `<img src="${staticMapUrl}" style="width:100%;border-radius:8px;" />`
    : `<div style="background:#f3f4f6;border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Sin ubicación</div>`;

  const gmapsBloque = gmapsLink
    ? `<div style="margin-top:8px;text-align:center;"><a href="${gmapsLink}" target="_blank" rel="noopener" style="display:inline-block;color:#1a2744;text-decoration:none;font-size:13px;font-weight:600;border:1px solid #d1d5db;border-radius:6px;padding:6px 12px;">📍 Abrir ubicación en Google Maps</a></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Ficha — ${ficha.nombre_lote ?? "Activo"}</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#111827;">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #F5A623;padding-bottom:12px;margin-bottom:20px;">
    <div style="font-size:24px;font-weight:800;">360<span style="color:#F5A623;">LATERAL</span></div>
    <div style="text-align:right;color:#6b7280;font-size:13px;">FICHA DEL ACTIVO<br/>Generada el ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>
  <h1 style="font-size:32px;margin:0 0 4px;">${ficha.nombre_lote ?? "Sin nombre"}</h1>
  <p style="color:#6b7280;margin:0 0 20px;">📍 ${[ficha.ciudad, ficha.barrio, ficha.direccion].filter(Boolean).join(" · ")}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
    <div>${fotosHtml || '<div style="background:#f3f4f6;border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Sin fotos</div>'}</div>
    <div>${mapaBloque}${gmapsBloque}</div>
  </div>
  <h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Datos del activo</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="padding:8px 0;color:#6b7280;width:40%;">Área</td><td style="padding:8px 0;font-weight:600;">${ficha.area_total_m2 ? Number(ficha.area_total_m2).toLocaleString("es-CO") + " m²" : "—"}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Uso / tipo</td><td style="padding:8px 0;font-weight:600;">${ficha.tipo_lote ?? "—"}</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;">Ciudad / sector</td><td style="padding:8px 0;font-weight:600;">${[ficha.ciudad, ficha.barrio].filter(Boolean).join(" · ") || "—"}</td></tr>
    ${ficha.precio_venta_estimado ? `<tr><td style="padding:8px 0;color:#6b7280;">Precio</td><td style="padding:8px 0;font-weight:600;">$${Number(ficha.precio_venta_estimado).toLocaleString("es-CO")} COP</td></tr>` : ""}
    ${ficha.propietario_nombre ? `<tr><td style="padding:8px 0;color:#6b7280;">Propietario</td><td style="padding:8px 0;font-weight:600;">${ficha.propietario_nombre}</td></tr>` : ""}
  </table>
  ${analisisHtml ? `<h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Análisis disponibles</h2><div style="margin-bottom:8px;">${analisisHtml}</div><p style="color:#6b7280;font-size:13px;">Los análisis detallados están disponibles bajo solicitud a 360Lateral.</p>` : ""}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;text-align:center;">
    Para más información sobre este activo, contacta a 360Lateral · urbanix360.com
  </div>
</body></html>`;
};

const LoteFicha = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useFichaLote(id);
  const { data: mapsKey } = useGoogleMapsKey();

  const copiarLink = async () => {
    const linkProduccion = `${PROD_BASE}/lotes/${id}/ficha`;
    try {
      await navigator.clipboard.writeText(linkProduccion);
      toast({ title: "Link copiado", description: linkProduccion });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const descargarHtml = () => {
    if (!data) return;
    const html = generarHtmlStandalone(data, mapsKey);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Ficha_${(data.nombre_lote ?? "activo").replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const abrirGoogleMaps = () => {
    if (data?.lat == null || data?.lng == null) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`,
      "_blank",
    );
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
  const tieneCoords = data.lat != null && data.lng != null;

  return (
    <div className="min-h-screen bg-muted/30 print:bg-background">
      <div className="no-print sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Logo />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copiarLink}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar link
            </Button>
            <Button variant="outline" size="sm" onClick={descargarHtml}>
              <Download className="mr-1.5 h-4 w-4" /> Descargar HTML
            </Button>
            {tieneCoords && (
              <Button variant="outline" size="sm" onClick={abrirGoogleMaps}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Google Maps
              </Button>
            )}
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Descargar PDF
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6 print:px-0 print:py-0">
        <Card className="ficha-doc bg-card p-6 shadow-sm print:border-0 print:shadow-none md:p-10">
          <header className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
            <Logo />
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Ficha del Activo</p>
              <p className="text-xs text-muted-foreground">Generada el <FechaHoy /></p>
            </div>
          </header>

          <section className="mb-6">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{data.nombre_lote}</h1>
            {ubicacion && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{ubicacion}</span>
              </p>
            )}
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2">
            <Galeria fotos={data.fotos ?? []} fallback={data.foto_url} nombre={data.nombre_lote ?? "Lote"} />
            <div className="space-y-2">
              <div className="h-[250px] w-full overflow-hidden rounded-lg">
                <MapaEstaticoLote
                  lat={data.lat ?? null}
                  lng={data.lng ?? null}
                  nombre={data.nombre_lote ?? "Lote"}
                />
              </div>
              {tieneCoords && (
                <div className="no-print text-center">
                  <Button variant="outline" size="sm" onClick={abrirGoogleMaps}>
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir en Google Maps
                  </Button>
                </div>
              )}
            </div>
          </section>

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
