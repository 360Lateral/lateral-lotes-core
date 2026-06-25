import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatCOP,
  formatMetros,
  formatNumero,
  formatPorcentaje,
} from "@/lib/format-moneda";
import type { PortafolioPropietarioData } from "@/hooks/portal/usePortafolioPropietario";

export const generarPdfPortafolio = async (
  data: PortafolioPropietarioData,
  setExportando?: (b: boolean) => void,
) => {
  setExportando?.(true);
  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ===== Page 1 — Resumen ejecutivo =====
    pdf.setFontSize(20).setFont("helvetica", "bold");
    pdf.text("Reporte ejecutivo de portafolio", 20, 25);

    pdf.setFontSize(10).setFont("helvetica", "normal");
    pdf.text(
      `${data.total_lotes} activo(s) · ${data.kpis.ciudades_distintas} ciudad(es) · Generado ${new Date().toLocaleDateString("es-CO")}`,
      20,
      32,
    );

    let y = 50;
    pdf.setFontSize(14).setFont("helvetica", "bold");
    pdf.text("Valoración del portafolio", 20, y);
    y += 8;
    pdf.setFontSize(11).setFont("helvetica", "normal");
    pdf.text(`Valor de mercado (avalúo): ${formatCOP(data.kpis.valor_avaluo_total)}`, 25, y); y += 6;
    pdf.text(`VPN si desarrollas: ${formatCOP(data.kpis.vpn_total_proyectado)}`, 25, y); y += 6;
    pdf.text(`TIR promedio ponderada: ${formatPorcentaje(data.kpis.tir_promedio_ponderada)}`, 25, y); y += 6;
    pdf.text(`Score promedio del portafolio: ${data.kpis.score_portafolio.toFixed(1)}/10`, 25, y);

    y += 15;
    pdf.setFontSize(14).setFont("helvetica", "bold");
    pdf.text("Detalle: Valor actual", 20, y); y += 8;
    pdf.setFontSize(11).setFont("helvetica", "normal");
    pdf.text(`Valor por m² promedio: ${formatCOP(data.lentes.avaluo.valor_m2_promedio)}/m²`, 25, y); y += 6;
    if (data.lentes.avaluo.lote_mas_valioso) {
      pdf.text(
        `Lote más valioso: ${data.lentes.avaluo.lote_mas_valioso.nombre_lote} (${formatCOP(data.lentes.avaluo.lote_mas_valioso.avaluo)})`,
        25, y,
      );
      y += 6;
    }
    if (data.lentes.avaluo.plusvalia_pct != null) {
      pdf.text(
        `Plusvalía vs compra: +${formatPorcentaje(data.lentes.avaluo.plusvalia_pct)} (${data.lentes.avaluo.anios_tenencia ?? "?"} años)`,
        25, y,
      );
      y += 6;
    }

    y += 10;
    pdf.setFontSize(14).setFont("helvetica", "bold");
    pdf.text("Detalle: Potencial de desarrollo", 20, y); y += 8;
    pdf.setFontSize(11).setFont("helvetica", "normal");
    pdf.text(`Unidades estimadas totales: ${formatNumero(data.lentes.desarrollo.unidades_totales)}`, 25, y); y += 6;
    pdf.text(`Área construible total: ${formatMetros(data.lentes.desarrollo.area_construible_total)}`, 25, y);

    // ===== Page 2 — Activos =====
    pdf.addPage();
    pdf.setFontSize(16).setFont("helvetica", "bold");
    pdf.text("Detalle de activos", 20, 20);

    autoTable(pdf, {
      startY: 30,
      head: [["#", "Lote", "Ciudad", "Área", "Score", "Valoración", "Plan"]],
      body: data.lotes.map((l, idx) => [
        idx + 1,
        l.nombre_lote,
        l.ciudad ?? "—",
        formatMetros(l.area_total_m2),
        l.score_promedio != null ? l.score_promedio.toFixed(1) : "—",
        formatCOP(l.valoracion),
        l.plan_nombre ?? "—",
      ]),
      headStyles: { fillColor: [21, 33, 65] },
      styles: { fontSize: 9 },
    });

    // ===== Page 3 — Salud por área =====
    pdf.addPage();
    pdf.setFontSize(16).setFont("helvetica", "bold");
    pdf.text("Salud técnica del portafolio", 20, 20);

    autoTable(pdf, {
      startY: 30,
      head: [["Área de análisis", "Score promedio", "Lotes críticos", "Lotes en revisión"]],
      body: data.salud_areas.map((a) => [
        a.nombre,
        `${a.promedio.toFixed(1)}/10`,
        a.criticos > 0 ? `${a.criticos} ⚠` : "0",
        `${a.warnings}`,
      ]),
      headStyles: { fillColor: [21, 33, 65] },
      styles: { fontSize: 9 },
    });

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8).setFont("helvetica", "italic");
      pdf.setTextColor(150);
      pdf.text(
        `360Lateral · Reporte ejecutivo de portafolio · Página ${i} de ${totalPages}`,
        20, 290,
      );
      pdf.text("Confidencial — Generado para uso del propietario únicamente", 20, 294);
      pdf.setTextColor(0);
    }

    pdf.save(`Portafolio_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    setExportando?.(false);
  }
};
