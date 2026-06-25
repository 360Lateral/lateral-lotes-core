import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Building, Check, Construction, Copy, Home, MapPin, Printer, ChevronLeft, ChevronRight, ExternalLink, Download, Loader2, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import MapaEstaticoLote from "@/components/lotes/MapaEstaticoLote";
import Logo from "@/components/ui/Logo";
import { useFichaLote, type FichaLoteData } from "@/hooks/useFichaLote";
import { useFichaEnriquecida } from "@/hooks/useFichaEnriquecida";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { toast } from "@/hooks/use-toast";
import { decodificarSecciones, decodeNotaB64 } from "@/lib/ficha-config";
import { generarPdfFicha } from "@/lib/generar-pdf-ficha";
import { FotoLote } from "@/components/lotes/FotoLote";
import { getSignedFotoUrl } from "@/lib/foto-storage";
import FichaBloquesExtra from "@/components/ficha/FichaBloquesExtra";

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
        <FotoLote
          url={lista[idx]}
          alt={`${nombre} - foto ${idx + 1}`}
          className="h-full w-full object-cover"
          fallbackClassName="h-full w-full"
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
              <FotoLote url={url} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const generarHtmlStandalone = (
  ficha: FichaLoteData,
  mapsKey: string | undefined,
  mostrar: (k: string) => boolean,
  titulo: string,
  nota: string,
): string => {
  const staticMapUrl =
    ficha.lat != null && ficha.lng != null && mapsKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${ficha.lat},${ficha.lng}&zoom=15&size=600x300&scale=2&markers=color:0xF5A623%7C${ficha.lat},${ficha.lng}&key=${mapsKey}`
      : "";

  const gmapsLink =
    ficha.lat != null && ficha.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${ficha.lat},${ficha.lng}`
      : "";

  const fotosHtml = mostrar("fotos")
    ? (ficha.fotos ?? [])
        .map((f) => `<img src="${(f as { signedUrl?: string }).signedUrl ?? f.url}" style="width:100%;border-radius:8px;margin-bottom:8px;" />`)
        .join("")
    : "";

  const analisisHtml = mostrar("analisis")
    ? (
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
        .join("")
    : "";

  const mapaBloque = mostrar("ubicacion")
    ? staticMapUrl
      ? `<img src="${staticMapUrl}" style="width:100%;border-radius:8px;" />`
      : `<div style="background:#f3f4f6;border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Sin ubicación</div>`
    : "";

  const gmapsBloque = mostrar("ubicacion") && gmapsLink
    ? `<div style="margin-top:8px;text-align:center;"><a href="${gmapsLink}" target="_blank" rel="noopener" style="display:inline-block;color:#1a2744;text-decoration:none;font-size:13px;font-weight:600;border:1px solid #d1d5db;border-radius:6px;padding:6px 12px;">📍 Abrir ubicación en Google Maps</a></div>`
    : "";

  const filasDatos: string[] = [];
  if (mostrar("area"))
    filasDatos.push(
      `<tr><td style="padding:8px 0;color:#6b7280;width:40%;">Área</td><td style="padding:8px 0;font-weight:600;">${ficha.area_total_m2 ? Number(ficha.area_total_m2).toLocaleString("es-CO") + " m²" : "—"}</td></tr>`,
    );
  if (mostrar("uso"))
    filasDatos.push(
      `<tr><td style="padding:8px 0;color:#6b7280;">Uso / tipo</td><td style="padding:8px 0;font-weight:600;">${ficha.tipo_lote ?? "—"}</td></tr>`,
    );
  if (mostrar("sector"))
    filasDatos.push(
      `<tr><td style="padding:8px 0;color:#6b7280;">Ciudad / sector</td><td style="padding:8px 0;font-weight:600;">${[ficha.ciudad, ficha.barrio].filter(Boolean).join(" · ") || "—"}</td></tr>`,
    );
  if (mostrar("precio") && ficha.precio_venta_estimado)
    filasDatos.push(
      `<tr><td style="padding:8px 0;color:#6b7280;">Precio</td><td style="padding:8px 0;font-weight:600;">$${Number(ficha.precio_venta_estimado).toLocaleString("es-CO")} COP</td></tr>`,
    );
  if (mostrar("propietario") && ficha.propietario_nombre)
    filasDatos.push(
      `<tr><td style="padding:8px 0;color:#6b7280;">Propietario</td><td style="padding:8px 0;font-weight:600;">${ficha.propietario_nombre}</td></tr>`,
    );

  const datosBloque =
    filasDatos.length > 0
      ? `<h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Datos del activo</h2><table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${filasDatos.join("")}</table>`
      : "";

  const ubicacionLinea = mostrar("sector")
    ? [ficha.ciudad, ficha.barrio, ficha.direccion].filter(Boolean).join(" · ")
    : "";

  const tituloBloque = titulo
    ? `<div style="background:#fff7ed;border-left:4px solid #F5A623;padding:10px 14px;margin-bottom:12px;border-radius:4px;"><p style="margin:0;font-size:15px;font-weight:600;color:#1a2744;">${titulo}</p></div>`
    : "";

  const notaBloque = nota
    ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px 14px;margin-bottom:20px;border-radius:8px;"><p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${nota}</p></div>`
    : "";

  const contactoBloque = mostrar("contacto")
    ? `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;text-align:center;">Para más información sobre este activo, contacta a 360Lateral · urbanix360.com</div>`
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
  ${tituloBloque}
  <h1 style="font-size:32px;margin:0 0 4px;">${ficha.nombre_lote ?? "Sin nombre"}</h1>
  ${ubicacionLinea ? `<p style="color:#6b7280;margin:0 0 20px;">📍 ${ubicacionLinea}</p>` : '<div style="margin-bottom:20px;"></div>'}
  ${notaBloque}
  ${(fotosHtml || mapaBloque) ? `<div style="display:grid;grid-template-columns:${fotosHtml && mapaBloque ? "1fr 1fr" : "1fr"};gap:16px;margin-bottom:24px;">${fotosHtml ? `<div>${fotosHtml}</div>` : ""}${mapaBloque ? `<div>${mapaBloque}${gmapsBloque}</div>` : ""}</div>` : ""}
  ${datosBloque}
  ${analisisHtml ? `<h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Análisis disponibles</h2><div style="margin-bottom:8px;">${analisisHtml}</div><p style="color:#6b7280;font-size:13px;">Los análisis detallados están disponibles bajo solicitud a 360Lateral.</p>` : ""}
  ${contactoBloque}
</body></html>`;
};

const LoteFicha = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error } = useFichaLote(id);
  const { data: enriquecida } = useFichaEnriquecida(id);
  const { data: mapsKey } = useGoogleMapsKey();

  const seccionesActivas = useMemo(
    () => decodificarSecciones(searchParams.get("s")),
    [searchParams],
  );
  const tituloCustom = searchParams.get("titulo") ?? "";
  const notaCustom = useMemo(
    () => decodeNotaB64(searchParams.get("nota")),
    [searchParams],
  );

  const mostrar = (key: string) =>
    seccionesActivas === null || seccionesActivas.includes(key);

  const copiarLink = async () => {
    const qs = searchParams.toString();
    const linkProduccion = `${PROD_BASE}/lotes/${id}/ficha${qs ? `?${qs}` : ""}`;
    try {
      await navigator.clipboard.writeText(linkProduccion);
      toast({ title: "Link copiado", description: linkProduccion });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const [generandoPdf, setGenerandoPdf] = useState(false);

  const descargarPdf = async () => {
    if (!data) return;
    setGenerandoPdf(true);
    try {
      await generarPdfFicha(data, {
        secciones: seccionesActivas,
        titulo: tituloCustom,
        nota: notaCustom,
      });
    } catch (e) {
      console.error("Error generando PDF:", e);
      toast({
        title: "No se pudo generar el PDF",
        description: "Puedes intentar 'Descargar HTML' como alternativa.",
        variant: "destructive",
      });
    } finally {
      setGenerandoPdf(false);
    }
  };

  const descargarHtml = async () => {
    if (!data) return;
    const fotosSignedRaw = await Promise.all(
      (data.fotos ?? []).map(async (f) => ({
        ...f,
        signedUrl: (await getSignedFotoUrl(f.url)) ?? f.url,
      })),
    );
    const dataConSigned = { ...data, fotos: fotosSignedRaw } as typeof data;
    const html = generarHtmlStandalone(dataConSigned, mapsKey, mostrar, tituloCustom, notaCustom);
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

  const ubicacionLinea = mostrar("sector")
    ? [data.ciudad, data.barrio, data.direccion].filter(Boolean).join(" · ")
    : "";
  const tieneCoords = data.lat != null && data.lng != null;

  // Decide if "Datos del activo" section has any row
  const tieneFilasDatos =
    mostrar("area") ||
    mostrar("uso") ||
    (mostrar("sector") && (data.ciudad || data.barrio)) ||
    (mostrar("precio") && data.publicado_venta && data.precio_venta_estimado != null) ||
    (mostrar("propietario") && !!data.propietario_nombre);

  const scorePromedio = enriquecida?.scorePromedio ?? null;
  const scoreViabilidad = enriquecida?.scoreViabilidad ?? null;
  const valoracion = enriquecida?.scores?.precio_venta_estimado ?? data.precio_venta_estimado ?? null;
  const normativa = enriquecida?.normativa ?? null;
  const tieneAlgunNormativo =
    !!normativa &&
    (normativa.indice_construccion != null ||
      normativa.indice_ocupacion != null ||
      normativa.altura_max_pisos != null ||
      normativa.densidad_max != null ||
      !!normativa.tratamiento);

  const seoTitle = `${data.nombre_lote ?? "Lote"} · 360Lateral`;
  const unidadesSeo = enriquecida?.arquitectonico?.unidades_estimadas ?? null;
  const tirSeo = enriquecida?.financiero?.tir_pct ?? null;
  const seoDesc = `${
    data.area_total_m2
      ? `${Number(data.area_total_m2).toLocaleString("es-CO")} m²`
      : "Lote"
  } en ${data.ciudad ?? "Colombia"}${
    scorePromedio != null ? ` · Score ${scorePromedio.toFixed(1)}/10` : ""
  }${valoracion ? ` · Valoración ${formatCOP(Number(valoracion))}` : ""}${
    unidadesSeo != null ? ` · ~${unidadesSeo} unidades` : ""
  }${tirSeo != null ? ` · TIR ${tirSeo.toFixed(1)}%` : ""}`;
  const seoUrl = `${PROD_BASE}/lotes/${id}/ficha`;
  const seoImage = data.foto_url ?? `${PROD_BASE}/og-default.png`;

  return (
    <div className="min-h-screen bg-muted/30 print:bg-background">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={seoUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={seoImage} />
      </Helmet>

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
            {tieneCoords && mostrar("ubicacion") && (
              <Button variant="outline" size="sm" onClick={abrirGoogleMaps}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Google Maps
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir
            </Button>
            <Button size="sm" onClick={descargarPdf} disabled={generandoPdf}>
              {generandoPdf ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generando PDF…
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-4 w-4" /> Descargar PDF
                </>
              )}
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

          {tituloCustom && (
            <div className="mb-4 rounded-md border-l-4 border-primary bg-primary/5 px-4 py-2.5">
              <p className="text-base font-semibold text-foreground">{tituloCustom}</p>
            </div>
          )}

          <section className="mb-6">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{data.nombre_lote}</h1>
            {ubicacionLinea && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{ubicacionLinea}</span>
              </p>
            )}
          </section>

          {/* Resumen ejecutivo: Score 360° + Valoración + Viabilidad */}
          {(scorePromedio != null || valoracion != null || scoreViabilidad != null) && (
            <section className="mb-6">
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 md:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 text-center">
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-700">Score 360°</p>
                    {scorePromedio != null ? (
                      <>
                        <p className="font-display text-3xl font-bold text-emerald-900 md:text-4xl">
                          {scorePromedio.toFixed(1)}
                          <span className="text-xl text-emerald-600 md:text-2xl">/10</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-700">
                          Promedio de {enriquecida?.analisisCompletados ?? 0} análisis
                        </p>
                      </>
                    ) : (
                      <p className="font-display text-3xl font-bold text-emerald-900/40">—</p>
                    )}
                  </div>
                  <div className="border-t border-emerald-200 pt-4 md:border-l md:border-r md:border-t-0 md:pt-0">
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-700">Valoración estimada</p>
                    {valoracion != null ? (
                      <>
                        <p className="font-display text-2xl font-bold text-emerald-900 md:text-3xl">
                          {formatCOP(Number(valoracion))}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-700">Basado en análisis financiero</p>
                      </>
                    ) : (
                      <p className="font-display text-3xl font-bold text-emerald-900/40">—</p>
                    )}
                  </div>
                  <div className="border-t border-emerald-200 pt-4 md:border-t-0 md:pt-0">
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-emerald-700">Score de viabilidad</p>
                    {scoreViabilidad != null ? (
                      <>
                        <p className="font-display text-3xl font-bold text-emerald-900 md:text-4xl">
                          {scoreViabilidad.toFixed(1)}
                          <span className="text-xl text-emerald-600 md:text-2xl">/10</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-700">Indicador de potencial</p>
                      </>
                    ) : (
                      <p className="font-display text-3xl font-bold text-emerald-900/40">—</p>
                    )}
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Lo que puedes construir: índices normativos */}
          {tieneAlgunNormativo && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Lo que puedes construir</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <NormativaChip
                  icon={Construction}
                  label="Índice construcción"
                  value={normativa?.indice_construccion != null ? Number(normativa.indice_construccion).toFixed(2) : "—"}
                />
                <NormativaChip
                  icon={Building}
                  label="Altura máxima"
                  value={
                    normativa?.altura_max_pisos
                      ? `${normativa.altura_max_pisos} pisos`
                      : normativa?.altura_max_metros
                      ? `${normativa.altura_max_metros} m`
                      : normativa?.altura_texto ?? "—"
                  }
                />
                <NormativaChip
                  icon={Square}
                  label="Índice ocupación"
                  value={normativa?.indice_ocupacion != null ? Number(normativa.indice_ocupacion).toFixed(2) : "—"}
                />
                <NormativaChip
                  icon={Home}
                  label="Densidad"
                  value={normativa?.densidad_max ? `${normativa.densidad_max} viv/ha` : "—"}
                />
              </div>
              {(normativa?.tratamiento || normativa?.zona_pot) && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-sm">
                  {normativa?.tratamiento && (
                    <p>
                      <span className="text-muted-foreground">Tratamiento POT:</span>{" "}
                      <span className="font-medium">{normativa.tratamiento}</span>
                    </p>
                  )}
                  {normativa?.zona_pot && (
                    <p>
                      <span className="text-muted-foreground">Zona POT:</span>{" "}
                      <span className="font-medium">{normativa.zona_pot}</span>
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {notaCustom && (
            <section className="mb-6">
              <Card className="border-border bg-muted/40 p-4">
                <p className="whitespace-pre-wrap text-sm text-foreground">{notaCustom}</p>
              </Card>
            </section>
          )}



          {(mostrar("fotos") || mostrar("ubicacion")) && (
            <section className={`mb-8 grid grid-cols-1 gap-4 ${mostrar("fotos") && mostrar("ubicacion") ? "md:grid-cols-2 print:grid-cols-2" : ""}`}>
              {mostrar("fotos") && (
                <Galeria fotos={data.fotos ?? []} fallback={data.foto_url} nombre={data.nombre_lote ?? "Lote"} />
              )}
              {mostrar("ubicacion") && (
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
              )}
            </section>
          )}

          {tieneFilasDatos && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Datos del activo</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {mostrar("area") && (
                  <DatoCard label="Área total" value={data.area_total_m2 ? `${Number(data.area_total_m2).toLocaleString("es-CO")} m²` : "—"} />
                )}
                {mostrar("uso") && <DatoCard label="Uso / tipo" value={data.tipo_lote ?? "—"} />}
                {mostrar("sector") && data.ciudad && <DatoCard label="Ciudad" value={data.ciudad} />}
                {mostrar("sector") && data.barrio && <DatoCard label="Sector" value={data.barrio} />}
                {mostrar("precio") && data.publicado_venta && data.precio_venta_estimado != null && (
                  <DatoCard label="Precio" value={formatCOP(Number(data.precio_venta_estimado))} highlight />
                )}
                {mostrar("propietario") && data.propietario_nombre && (
                  <DatoCard label="Propietario" value={data.propietario_nombre} />
                )}
              </div>
            </section>
          )}

          {mostrar("analisis") && analisis.length > 0 && (
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

          {mostrar("contacto") && (
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
          )}
        </Card>
      </main>
    </div>
  );
};

const NormativaChip = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-border bg-card p-3">
    <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <p className="text-[10px] uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-sm font-semibold text-foreground">{value}</p>
  </div>
);

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
