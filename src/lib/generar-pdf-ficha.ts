import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getSignedFotoUrl } from "@/lib/foto-storage";
import { formatCOP, formatMetros, formatNumero } from "@/lib/format-moneda";

export interface FichaPdfEnriquecida {
  scorePromedio?: number | null;
  scoreViabilidad?: number | null;
  scoresIndividuales?: Partial<Record<
    "juridico" | "normativo" | "ambiental" | "sspp" | "geotecnico" | "mercado" | "arquitectonico" | "financiero",
    number | null
  >>;
  arquitectonico?: {
    m2_construibles_total: number | null;
    unidades_estimadas: number | null;
    area_vendible_pct: number | null;
    tipologias: string | null;
    eficiencia_lote_pct: number | null;
    forma_lote: string | null;
    permite_sotano: boolean | null;
    observaciones: string | null;
  } | null;
  financiero?: {
    valor_compra_lote: number | null;
    tir_pct: number | null;
    vpn: number | null;
    punto_equilibrio_pct: number | null;
    margen_bruto_pct: number | null;
    observaciones: string | null;
  } | null;
  mercado?: {
    precio_venta_m2_zona: number | null;
    proyectos_competidores: number | null;
    velocidad_absorcion_unidades_mes: number | null;
    valorizacion_anual_pct: number | null;
    observaciones: string | null;
  } | null;
  perfiles?: { titulo: string; razon: string }[];
}

export interface FichaPdfData {
  nombre_lote?: string;
  ciudad?: string | null;
  barrio?: string | null;
  direccion?: string | null;
  area_total_m2?: number | null;
  tipo_lote?: string | null;
  precio_venta_estimado?: number | null;
  propietario_nombre?: string | null;
  lat?: number | null;
  lng?: number | null;
  foto_url?: string | null;
  fotos?: { url: string; orden: number }[];
  publicado_venta?: boolean;
  tiene_analisis_juridico?: boolean;
  tiene_analisis_ambiental?: boolean;
  tiene_analisis_arquitectonico?: boolean;
  tiene_analisis_financiero?: boolean;
  tiene_analisis_geotecnico?: boolean;
  tiene_analisis_mercado?: boolean;
  tiene_analisis_sspp?: boolean;
  enriquecida?: FichaPdfEnriquecida | null;
}

export interface OpcionesFichaPdf {
  secciones: string[] | null; // null = todas
  titulo?: string;
  nota?: string;
}

async function imagenABase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { mode: "cors" });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generarQrUbicacion(lat: number, lng: number): Promise<string | null> {
  if (!lat || !lng) return null;
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  try {
    return await QRCode.toDataURL(url, { width: 200, margin: 1 });
  } catch {
    return null;
  }
}

function detectarFormatoImagen(dataUrl: string): "JPEG" | "PNG" {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return "JPEG";
}

export async function generarPdfFicha(
  ficha: FichaPdfData,
  opciones: OpcionesFichaPdf,
): Promise<void> {
  const mostrar = (k: string) =>
    opciones.secciones === null || opciones.secciones.includes(k);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 60) {
      doc.addPage();
      y = margin;
    }
  };

  // ---- Encabezado branding ----
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.text("360", margin, y);
  doc.setTextColor(245, 166, 35);
  doc.text("LATERAL", margin + 42, y);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text("FICHA DEL ACTIVO", pageW - margin, y - 8, { align: "right" });
  doc.text(
    "Generada el " +
      new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
    pageW - margin,
    y + 4,
    { align: "right" },
  );
  y += 14;
  doc.setDrawColor(245, 166, 35);
  doc.setLineWidth(2);
  doc.line(margin, y, pageW - margin, y);
  y += 24;

  // ---- Título personalizado ----
  if (opciones.titulo) {
    doc.setFontSize(13);
    doc.setTextColor(245, 166, 35);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(opciones.titulo, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 16 + 4;
  }

  // ---- Nombre lote ----
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  const nombreLines = doc.splitTextToSize(ficha.nombre_lote ?? "Activo", pageW - margin * 2);
  doc.text(nombreLines, margin, y);
  y += nombreLines.length * 26;

  // ---- Ubicación texto ----
  if (mostrar("sector") || mostrar("ubicacion")) {
    const partes: string[] = [];
    if (mostrar("sector")) {
      if (ficha.ciudad) partes.push(ficha.ciudad);
      if (ficha.barrio) partes.push(ficha.barrio);
    }
    if (mostrar("ubicacion") && ficha.direccion) partes.push(ficha.direccion);
    const ubic = partes.join("  ·  ");
    if (ubic) {
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      const ul = doc.splitTextToSize(ubic, pageW - margin * 2);
      doc.text(ul, margin, y);
      y += ul.length * 14 + 8;
    } else {
      y += 4;
    }
  }

  y += 6;

  // ---- Nota personalizada ----
  if (opciones.nota) {
    doc.setFillColor(243, 244, 246);
    const notaLines = doc.splitTextToSize(opciones.nota, pageW - margin * 2 - 20);
    const notaH = notaLines.length * 14 + 16;
    ensureSpace(notaH + 12);
    doc.roundedRect(margin, y, pageW - margin * 2, notaH, 6, 6, "F");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.text(notaLines, margin + 10, y + 18);
    y += notaH + 16;
  }

  // ---- Foto principal ----
  if (mostrar("fotos")) {
    const fotoUrl =
      ficha.fotos && ficha.fotos.length > 0
        ? [...ficha.fotos].sort((a, b) => a.orden - b.orden)[0].url
        : ficha.foto_url ?? null;
    if (fotoUrl) {
      const signed = await getSignedFotoUrl(fotoUrl);
      const b64 = signed ? await imagenABase64(signed) : null;
      if (b64) {
        try {
          const imgW = pageW - margin * 2;
          const imgH = imgW * 0.5;
          ensureSpace(imgH + 16);
          doc.addImage(b64, detectarFormatoImagen(b64), margin, y, imgW, imgH, undefined, "FAST");
          y += imgH + 16;
        } catch {
          /* omitir */
        }
      }
    }
  }

  // ---- Datos del activo ----
  const filas: [string, string][] = [];
  if (mostrar("area") && ficha.area_total_m2)
    filas.push(["Área", NumberformatMetros(ficha.area_total_m2)]);
  if (mostrar("uso") && ficha.tipo_lote) filas.push(["Uso / tipo", ficha.tipo_lote]);
  if (mostrar("sector")) {
    const s = [ficha.ciudad, ficha.barrio].filter(Boolean).join(" · ");
    if (s) filas.push(["Ciudad / sector", s]);
  }
  if (mostrar("precio") && ficha.precio_venta_estimado)
    filas.push([
      "Precio",
      formatCOP(Number(ficha.precio_venta_estimado)),
    ]);
  if (mostrar("propietario") && ficha.propietario_nombre)
    filas.push(["Propietario", ficha.propietario_nombre]);

  if (filas.length > 0) {
    ensureSpace(24 + filas.length * 18 + 12);
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del activo", margin, y);
    y += 18;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    for (const [k, v] of filas) {
      ensureSpace(18);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text(k, margin, y);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      const vLines = doc.splitTextToSize(v, pageW - margin - (margin + 150));
      doc.text(vLines, margin + 150, y);
      y += Math.max(18, vLines.length * 14);
    }
    y += 12;
  }

  // ---- Análisis disponibles ----
  if (mostrar("analisis")) {
    const analisis = (
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
      .filter(([, t]) => t)
      .map(([n]) => n);

    if (analisis.length > 0) {
      ensureSpace(60);
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text("Análisis disponibles", margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105);
      doc.setFont("helvetica", "normal");
      const txt = analisis.map((a) => "[OK] " + a).join("    ");
      const txtLines = doc.splitTextToSize(txt, pageW - margin * 2);
      doc.text(txtLines, margin, y);
      y += txtLines.length * 14 + 4;
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        "Los análisis detallados están disponibles bajo solicitud a 360Lateral.",
        margin,
        y,
      );
      y += 20;
    }
  }

  // ---- Ubicación: QR ----
  if (mostrar("ubicacion") && ficha.lat != null && ficha.lng != null) {
    const qr = await generarQrUbicacion(Number(ficha.lat), Number(ficha.lng));
    if (qr) {
      ensureSpace(110);
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text("Ubicación", margin, y);
      y += 8;
      doc.addImage(qr, "PNG", margin, y, 90, 90);
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Escanea el código para abrir la", margin + 105, y + 30);
      doc.text("ubicación exacta en Google Maps.", margin + 105, y + 44);
      y += 100;
    }
  }

  // ---- Bloques enriquecidos (sprint 4) ----
  const enr = ficha.enriquecida;
  if (enr && (enr.arquitectonico || enr.financiero || enr.mercado || enr.scoresIndividuales)) {
    doc.addPage();
    y = margin;

    const sectionTitle = (txt: string) => {
      ensureSpace(28);
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text(txt, margin, y);
      y += 6;
      doc.setDrawColor(245, 166, 35);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + 60, y);
      y += 14;
    };

    const kv = (label: string, val: string) => {
      ensureSpace(16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(label, margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      const lines = doc.splitTextToSize(val, pageW - margin - (margin + 180));
      doc.text(lines, margin + 180, y);
      y += Math.max(16, lines.length * 13);
    };

    const fmtCOP = (n: number | null | undefined) =>
      n == null ? "—" : formatCOP(Number(n));
    const fmtPct = (n: number | null | undefined) =>
      n == null ? "—" : `${Number(n).toFixed(1)}%`;
    const fmtN = (n: number | null | undefined) =>
      n == null ? "—" : formatNumero(Number(n));

    if (enr.arquitectonico) {
      sectionTitle("Aprovechamiento arquitectónico");
      const a = enr.arquitectonico;
      kv("Área construible", a.m2_construibles_total != null ? `${fmtN(a.m2_construibles_total)} m²` : "—");
      kv("Unidades estimadas", String(a.unidades_estimadas ?? "—"));
      kv("Área vendible", fmtPct(a.area_vendible_pct));
      kv("Eficiencia del lote", fmtPct(a.eficiencia_lote_pct));
      if (a.tipologias) kv("Tipologías", a.tipologias);
      if (a.forma_lote) kv("Forma del lote", a.forma_lote);
      if (a.permite_sotano != null) kv("Sótano", a.permite_sotano ? "Permitido" : "No permitido");
      if (a.observaciones) kv("Notas", a.observaciones);
      y += 8;
    }

    if (enr.scoresIndividuales) {
      sectionTitle("Análisis técnico por área");
      const labels: Record<string, string> = {
        juridico: "Jurídico",
        normativo: "Normativo",
        ambiental: "Ambiental",
        sspp: "Servicios públicos",
        geotecnico: "Suelos",
        mercado: "Mercado",
        arquitectonico: "Arquitectónico",
        financiero: "Financiero",
      };
      for (const [k, v] of Object.entries(enr.scoresIndividuales)) {
        if (v == null) continue;
        const nivel = v >= 7 ? "[OK]" : v >= 4 ? "[!]" : "[X]";
        kv(labels[k] ?? k, `${nivel} ${Number(v).toFixed(1)}/10`);
      }
      y += 8;
    }

    if (enr.financiero || enr.mercado) {
      sectionTitle("Financiero y mercado");
      const f = enr.financiero;
      const m = enr.mercado;
      if (f) {
        kv("Valor compra estimado", fmtCOP(f.valor_compra_lote));
        kv("TIR proyectada", fmtPct(f.tir_pct));
        kv("VPN", fmtCOP(f.vpn));
        kv("Margen bruto", fmtPct(f.margen_bruto_pct));
        kv("Punto de equilibrio", fmtPct(f.punto_equilibrio_pct));
      }
      if (m) {
        kv("Valor m² zona", fmtCOP(m.precio_venta_m2_zona));
        if (m.proyectos_competidores != null) kv("Proyectos competidores", String(m.proyectos_competidores));
        if (m.velocidad_absorcion_unidades_mes != null)
          kv("Absorción", `${m.velocidad_absorcion_unidades_mes} und/mes`);
        if (m.valorizacion_anual_pct != null) kv("Valorización anual", fmtPct(m.valorizacion_anual_pct));
      }
      y += 8;
    }

    if (enr.perfiles && enr.perfiles.length > 0) {
      sectionTitle("¿Para quién es ideal este lote?");
      for (const p of enr.perfiles) {
        ensureSpace(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text("• " + p.titulo, margin, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        const lines = doc.splitTextToSize(p.razon, pageW - margin * 2 - 14);
        doc.text(lines, margin + 14, y);
        y += lines.length * 13 + 6;
      }
    }
  }

  // ---- Footer / contacto ----
  if (mostrar("contacto")) {
    const footerY = pageH - 50;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(margin, footerY, pageW - margin, footerY);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Para más información sobre este activo, contacta a 360Lateral · urbanix360.com",
      pageW / 2,
      footerY + 18,
      { align: "center" },
    );
  }

  const nombreArchivo = `Ficha_${(ficha.nombre_lote ?? "activo").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(nombreArchivo);
}
