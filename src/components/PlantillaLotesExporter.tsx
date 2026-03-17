import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLUMNS = [
  "Nombre del lote",
  "Dirección",
  "Ciudad / Municipio",
  "Departamento",
  "Matrícula inmobiliaria",
  "Área m²",
  "Estrato",
  "Tipo de lote",
  "Barrio",
  "Latitud",
  "Longitud",
  "Nombre propietario",
  "Notas",
];

const PlantillaLotesExporter = () => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data: lotes, error } = await supabase
        .from("lotes")
        .select("nombre_lote,direccion,ciudad,departamento,matricula_inmobiliaria,area_total_m2,estrato,tipo_lote,barrio,lat,lng,nombre_propietario,notas")
        .order("nombre_lote");

      if (error) throw error;

      const wb = XLSX.utils.book_new();

      // Sheet 1: Instrucciones
      const instrData = [
        ["PLANTILLA DE LOTES — 360 LATERAL", ""],
        ["", ""],
        ["INSTRUCCIONES", ""],
        ["1. La hoja 'Lotes' contiene los lotes actuales de la plataforma.", ""],
        ["2. Edita los campos que necesites actualizar.", ""],
        ["3. Para agregar lotes nuevos, añade filas al final.", ""],
        ["4. El campo 'Nombre del lote' es obligatorio y se usa para identificar lotes existentes.", ""],
        ["5. Si el nombre coincide con un lote existente, se actualizará. Si no, se creará uno nuevo.", ""],
        ["6. No modifiques los encabezados de las columnas.", ""],
        ["", ""],
        ["CÓMO REIMPORTAR", ""],
        ["1. Guarda el archivo Excel.", ""],
        ["2. En la plataforma: Dashboard → Lotes → Importar.", ""],
        ["3. Sube este archivo. El sistema detectará automáticamente qué lotes actualizar y cuáles crear.", ""],
        ["", ""],
        ["Fecha de generación", new Date().toLocaleDateString("es-CO")],
        ["Total de lotes exportados", lotes?.length ?? 0],
      ];
      const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
      wsInstr["!cols"] = [{ wch: 50 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

      // Sheet 2: Lotes
      const lotesRows = (lotes ?? []).map((l) => [
        l.nombre_lote ?? "",
        l.direccion ?? "",
        l.ciudad ?? "",
        l.departamento ?? "",
        l.matricula_inmobiliaria ?? "",
        l.area_total_m2 ?? "",
        l.estrato ?? "",
        l.tipo_lote ?? "",
        l.barrio ?? "",
        l.lat ?? "",
        l.lng ?? "",
        l.nombre_propietario ?? "",
        l.notas ?? "",
      ]);

      const wsLotes = XLSX.utils.aoa_to_sheet([COLUMNS, ...lotesRows]);
      wsLotes["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
      XLSX.utils.book_append_sheet(wb, wsLotes, "Lotes");

      // Download
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fecha = new Date().toISOString().split("T")[0];
      a.download = `Plantilla_Lotes_360_${fecha}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Plantilla descargada con ${lotes?.length ?? 0} lotes`);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar la plantilla");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Generando…" : "Descargar plantilla"}
    </Button>
  );
};

export default PlantillaLotesExporter;
