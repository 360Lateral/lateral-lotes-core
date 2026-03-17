import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

const boolStr = (val: boolean | null | undefined, hasData: any): string => {
  if (!hasData) return "";
  return val ? "Sí" : "No";
};

const makeSheet = (data: any[][]): XLSX.WorkSheet => {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 36 }, { wch: 30 }];
  return ws;
};

interface Props {
  loteId: string;
}

const ExcelAnalisisExporter = ({ loteId }: Props) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [
        { data: lote },
        { data: normativa },
        { data: juridico },
        { data: ambiental },
        { data: sspp },
        { data: geotecnico },
        { data: mercado },
        { data: arquitectonico },
        { data: financiero },
      ] = await Promise.all([
        supabase.from("lotes").select("*").eq("id", loteId).single(),
        supabase.from("normativa_urbana").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_juridico").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_ambiental").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_sspp").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_geotecnico").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_mercado").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_arquitectonico").select("*").eq("lote_id", loteId).maybeSingle(),
        supabase.from("analisis_financiero").select("*").eq("lote_id", loteId).maybeSingle(),
      ]);

      const wb = XLSX.utils.book_new();

      // Portada
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["360 LATERAL — ANÁLISIS RESOLUTORÍA 360°", ""],
        ["", ""],
        ["Nombre del predio", lote?.nombre_lote ?? ""],
        ["Municipio y departamento", (lote?.ciudad ?? "") + ", " + (lote?.departamento ?? "")],
        ["Matrícula inmobiliaria", lote?.matricula_inmobiliaria ?? ""],
        ["Área total (m²)", lote?.area_total_m2 ?? ""],
        ["Dirección aproximada", lote?.direccion ?? ""],
        ["Fecha del análisis", new Date().toLocaleDateString("es-CO")],
        ["Versión", "v1.0"],
      ]), "Portada");

      // Importar a 360 Lateral
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["DATOS DE IMPORTACIÓN", ""],
        ["ID del lote en plataforma", lote?.id ?? ""],
        ["Nombre del lote (confirmación)", lote?.nombre_lote ?? ""],
        ["Fecha del análisis", new Date().toLocaleDateString("es-CO")],
        ["Analista responsable", ""],
        ["", ""],
        ["INSTRUCCIONES", ""],
        ["1. Completa los campos de cada hoja de análisis", ""],
        ["2. El ID del lote ya está precargado arriba", ""],
        ["3. En la plataforma: Admin → Lote → Análisis → Importar desde Excel", ""],
      ]), "Importar a 360 Lateral");

      // 1. Normativo
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS NORMATIVO", ""],
        ["", ""],
        ["Uso principal del suelo (POT)", normativa?.uso_principal ?? ""],
        ["Usos compatibles permitidos", normativa?.usos_compatibles?.join(", ") ?? ""],
        ["Índice de Construcción (IC)", normativa?.indice_construccion ?? ""],
        ["Índice de Ocupación (IO)", normativa?.indice_ocupacion ?? ""],
        ["Altura máxima (pisos)", normativa?.altura_max_pisos ?? ""],
        ["Altura máxima (metros)", normativa?.altura_max_metros ?? ""],
        ["Aislamiento frontal (m)", normativa?.aislamiento_frontal_m ?? ""],
        ["Aislamiento posterior (m)", normativa?.aislamiento_posterior_m ?? ""],
        ["Aislamiento lateral (m)", normativa?.aislamiento_lateral_m ?? ""],
        ["Zona POT", normativa?.zona_pot ?? ""],
        ["Tratamiento urbanístico", normativa?.tratamiento ?? ""],
        ["Norma vigente", normativa?.norma_vigente ?? ""],
        ["Cesión tipo A (%)", normativa?.cesion_tipo_a_pct ?? ""],
        ["Plan parcial aplicable", ""],
        ["", ""],
        ["OBSERVACIONES", ""],
      ]), "1. Normativo");

      // 2. Jurídico
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS JURÍDICO", ""],
        ["", ""],
        ["Matrícula inmobiliaria verificada", ""],
        ["Años de tradición analizados", ""],
        ["Estado cadena de tradición", juridico?.cadena_tradicion ?? ""],
        ["Propietario coincide con vendedor", ""],
        ["Hipoteca activa", boolStr(juridico?.hipoteca_activa, juridico)],
        ["Embargo o medida cautelar", boolStr(juridico?.gravamenes, juridico)],
        ["Servidumbres registradas", boolStr(juridico?.servidumbres, juridico)],
        ["Afectación vial", ""],
        ["Limitación al dominio", ""],
        ["Predial al día", juridico ? (juridico.deuda_predial ? "No" : "Sí") : ""],
        ["Valorización pendiente", ""],
        ["Plusvalía pendiente", ""],
        ["Áreas escritura vs catastral coinciden", juridico ? (juridico.discrepancia_areas ? "No" : "Sí") : ""],
        ["Litigio activo", boolStr(juridico?.litigio_activo, juridico)],
        ["Proceso de sucesión", boolStr(juridico?.proceso_sucesion, juridico)],
        ["Número de copropietarios", ""],
        ["", ""],
        ["OBSERVACIONES", juridico?.observaciones ?? ""],
      ]), "2. Jurídico");

      // 3. Ambiental
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS AMBIENTAL", ""],
        ["", ""],
        ["Ronda hídrica presente", boolStr(ambiental?.ronda_hidrica, ambiental)],
        ["Distancia a ronda (m)", ambiental?.distancia_ronda_m ?? ""],
        ["Reserva forestal", boolStr(ambiental?.reserva_forestal, ambiental)],
        ["Suelo de protección ambiental", ""],
        ["Amenaza por inundación", ambiental?.amenaza_inundacion ?? ""],
        ["Amenaza por remoción en masa", ambiental?.amenaza_remocion ?? ""],
        ["Zona sísmica (NSR-10)", ""],
        ["Historial industrial en el predio", ""],
        ["Pasivo ambiental identificado", boolStr(ambiental?.pasivo_ambiental, ambiental)],
        ["Costo estimado remediación (COP)", ""],
        ["Requiere licencia ambiental", boolStr(ambiental?.requiere_licencia_ambiental, ambiental)],
        ["Requiere Plan de Manejo Ambiental", ""],
        ["Restricción de tala", ""],
        ["Concepto previo CAR", ""],
        ["", ""],
        ["OBSERVACIONES", ambiental?.observaciones ?? ""],
      ]), "3. Ambiental");

      // 4. SSPP
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS SERVICIOS PÚBLICOS", ""],
        ["", ""],
        ["Acueducto disponible", boolStr(sspp?.acueducto_disponible, sspp)],
        ["Alcantarillado disponible", boolStr(sspp?.alcantarillado_disponible, sspp)],
        ["Energía eléctrica disponible", boolStr(sspp?.energia_disponible, sspp)],
        ["Gas natural disponible", boolStr(sspp?.gas_disponible, sspp)],
        ["Telecomunicaciones disponible", ""],
        ["Capacidad red acueducto (L/s)", ""],
        ["Capacidad red eléctrica (kVA)", sspp?.capacidad_red_kva ?? ""],
        ["Red saturada", ""],
        ["Distancia a red acueducto (m)", ""],
        ["Distancia a red energía (m)", sspp?.distancia_red_matriz_m ?? ""],
        ["Costo extensión acueducto (COP)", ""],
        ["Costo extensión energía (COP)", sspp?.costo_extension_estimado ?? ""],
        ["Vía pavimentada", boolStr(sspp?.via_pavimentada, sspp)],
        ["Ancho de vía (m)", ""],
        ["Vía pública o privada", ""],
        ["", ""],
        ["OBSERVACIONES", sspp?.observaciones ?? ""],
      ]), "4. SSPP");

      // 5. Suelos
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS GEOTÉCNICO", ""],
        ["", ""],
        ["Tipo de suelo", geotecnico?.tipo_suelo ?? ""],
        ["Descripción del perfil", ""],
        ["Capacidad portante (ton/m²)", geotecnico?.capacidad_portante_ton_m2 ?? ""],
        ["Nivel freático (m)", geotecnico?.nivel_freatico_m ?? ""],
        ["Pendiente promedio (%)", geotecnico?.pendiente_pct ?? ""],
        ["Pendiente máxima (%)", ""],
        ["Tipo de terreno", ""],
        ["Volumen corte y relleno (m³)", ""],
        ["Sistema de cimentación", geotecnico?.sistema_cimentacion ?? ""],
        ["Profundidad de desplante (m)", ""],
        ["Sobrecosto cimentación (COP)", geotecnico?.sobrecosto_cimentacion_estimado ?? ""],
        ["Sobrecosto como % del total", ""],
        ["Riesgo de asentamientos", ""],
        ["Riesgo de licuación", ""],
        ["Rellenos antrópicos", ""],
        ["", ""],
        ["OBSERVACIONES", geotecnico?.observaciones ?? ""],
      ]), "5. Suelos");

      // 6. Mercado
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS DE MERCADO", ""],
        ["", ""],
        ["Precio promedio venta m² zona (COP)", mercado?.precio_venta_m2_zona ?? ""],
        ["Precio mínimo m² zona (COP)", ""],
        ["Precio máximo m² zona (COP)", ""],
        ["Precio lote m² zona (COP)", ""],
        ["Tendencia de precios", ""],
        ["Proyectos competidores activos", mercado?.proyectos_competidores ?? ""],
        ["Unidades disponibles competencia", ""],
        ["Principales competidores", ""],
        ["Diferenciador del proyecto", ""],
        ["Velocidad absorción (un/mes)", mercado?.velocidad_absorcion_unidades_mes ?? ""],
        ["Meses estimados de venta", ""],
        ["Perfil del comprador", mercado?.perfil_comprador ?? ""],
        ["Rango precio por unidad (COP)", mercado?.precio_unidad_promedio ?? ""],
        ["Valorización anual zona (%)", mercado?.valorizacion_anual_pct ?? ""],
        ["Proyectos infraestructura cercanos", ""],
        ["Índice de escasez de suelo", ""],
        ["", ""],
        ["OBSERVACIONES", mercado?.observaciones ?? ""],
      ]), "6. Mercado");

      // 7. Arquitectónico
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS ARQUITECTÓNICO — CABIDA", ""],
        ["", ""],
        ["Área total del lote (m²)", arquitectonico ? "" : (lote?.area_total_m2 ?? "")],
        ["Área neta urbanizable (m²)", ""],
        ["M² construibles totales", arquitectonico?.m2_construibles_total ?? ""],
        ["M² vendibles estimados", ""],
        ["Eficiencia del lote (%)", arquitectonico?.eficiencia_lote_pct ?? ""],
        ["Tipología predominante", arquitectonico?.tipologias ?? ""],
        ["Área promedio por unidad (m²)", ""],
        ["Unidades habitacionales estimadas", arquitectonico?.unidades_estimadas ?? ""],
        ["Locales comerciales estimados", ""],
        ["Parqueaderos estimados", ""],
        ["Forma del lote", arquitectonico?.forma_lote ?? ""],
        ["Frente del lote (ml)", lote?.frente_ml ?? ""],
        ["Fondo del lote (ml)", lote?.fondo_ml ?? ""],
        ["Relación frente/fondo", ""],
        ["Permite sótano", boolStr(arquitectonico?.permite_sotano, arquitectonico)],
        ["Número de torres/bloques", ""],
        ["Altura propuesta (pisos)", ""],
        ["Observación de implantación", ""],
        ["", ""],
        ["OBSERVACIONES", arquitectonico?.observaciones ?? ""],
      ]), "7. Arquitectónico");

      // 8. Financiero
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["ANÁLISIS FINANCIERO", ""],
        ["", ""],
        ["Precio de compra del lote (COP)", financiero?.valor_compra_lote ?? ""],
        ["Precio de compra por m² (COP)", ""],
        ["Precio de mercado del lote (COP)", ""],
        ["Plusvalía del lote (%)", ""],
        ["Costo construcción (COP/m²)", financiero?.costo_construccion_m2 ?? ""],
        ["Costo total construcción (COP)", ""],
        ["Costos diseño y honorarios (COP)", ""],
        ["Costos urbanismo y conexiones (COP)", ""],
        ["Costo total del proyecto (COP)", ""],
        ["Precio venta m² vendible (COP)", ""],
        ["Total m² vendibles", ""],
        ["Ingresos por ventas (COP)", ""],
        ["Ingresos por parqueaderos (COP)", ""],
        ["Ingresos totales (COP)", financiero?.ingresos_proyectados ?? ""],
        ["Utilidad bruta (COP)", ""],
        ["Margen bruto (%)", financiero?.margen_bruto_pct ?? ""],
        ["TIR del proyecto (%)", financiero?.tir_pct ?? ""],
        ["VPN del proyecto (COP)", financiero?.vpn ?? ""],
        ["Punto de equilibrio (%)", financiero?.punto_equilibrio_pct ?? ""],
        ["Período de recuperación (meses)", ""],
        ["Relación costo-beneficio", ""],
        ["", ""],
        ["OBSERVACIONES", financiero?.observaciones ?? ""],
      ]), "8. Financiero");

      // Resumen Ejecutivo
      XLSX.utils.book_append_sheet(wb, makeSheet([
        ["RESUMEN EJECUTIVO — RESOLUTORÍA 360°", ""],
        ["Lote", lote?.nombre_lote ?? ""],
        ["Municipio", lote?.ciudad ?? ""],
        ["Fecha", new Date().toLocaleDateString("es-CO")],
        ["", ""],
        ["ÁREA", "ESTADO"],
        ["1. Normativo", normativa ? "Completado" : "Pendiente"],
        ["2. Jurídico", juridico ? "Completado" : "Pendiente"],
        ["3. Ambiental", ambiental ? "Completado" : "Pendiente"],
        ["4. SSPP", sspp ? "Completado" : "Pendiente"],
        ["5. Suelos", geotecnico ? "Completado" : "Pendiente"],
        ["6. Mercado", mercado ? "Completado" : "Pendiente"],
        ["7. Arquitectónico", arquitectonico ? "Completado" : "Pendiente"],
        ["8. Financiero", financiero ? "Completado" : "Pendiente"],
        ["", ""],
        ["TEASER FINANCIERO", ""],
        ["Valor estimado del lote (COP)", financiero?.valor_compra_lote ?? ""],
        ["M² construibles totales", arquitectonico?.m2_construibles_total ?? ""],
        ["Unidades estimadas", arquitectonico?.unidades_estimadas ?? ""],
        ["Ingresos proyectados (COP)", financiero?.ingresos_proyectados ?? ""],
        ["Margen bruto estimado (%)", financiero?.margen_bruto_pct ?? ""],
        ["TIR estimada (%)", financiero?.tir_pct ?? ""],
        ["Mayor y mejor uso posible", arquitectonico?.tipologias ?? ""],
      ]), "Resumen Ejecutivo");

      // Download
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fecha = new Date().toISOString().split("T")[0];
      const nombre = lote?.nombre_lote?.replace(/\s+/g, "_") ?? "lote";
      a.download = `Analisis_360_${nombre}_${fecha}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: `Archivo descargado: Analisis_360_${nombre}_${fecha}.xlsx`,
      });
    } catch (e: any) {
      toast({ title: "Error al exportar", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exportando…" : "Exportar a Excel"}
    </Button>
  );
};

export default ExcelAnalisisExporter;
