import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface PdfProps {
  areaKey: string;
  showPdfInput: string | null;
  setShowPdfInput: React.Dispatch<React.SetStateAction<string | null>>;
  pdfUrl: string;
  setPdfUrl: React.Dispatch<React.SetStateAction<string>>;
  extrayendo: string | null;
  extraerDesdePdf: (area: string) => Promise<void>;
  datosExtraidos: Record<string, any>;
  setDatosExtraidos: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export interface PdfExtractContext {
  pdfUrl: string;
  setPdfUrl: React.Dispatch<React.SetStateAction<string>>;
  showPdfInput: string | null;
  setShowPdfInput: React.Dispatch<React.SetStateAction<string | null>>;
  extrayendo: string | null;
  datosExtraidos: Record<string, any>;
  setDatosExtraidos: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  extraerDesdePdf: (area: string) => Promise<void>;
  makePdfProps: (areaKey: string) => PdfProps;
  extractedCount: number;
  resetExtracted: () => void;
}

interface LoteContext {
  nombre_lote?: string | null;
  ciudad?: string | null;
  area_total_m2?: number | null;
}

/**
 * Hook único de extracción PDF para todas las secciones del editor.
 * Mantener UNA sola instancia en el contenedor (página o engagement) para
 * que `datosExtraidos` se distribuya entre todas las secciones que se monten.
 */
export const usePdfExtractAnalisis = (
  loteContext?: LoteContext | null,
): PdfExtractContext => {
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState("");
  const [extrayendo, setExtrayendo] = useState<string | null>(null);
  const [datosExtraidos, setDatosExtraidos] = useState<Record<string, any>>({});
  const [showPdfInput, setShowPdfInput] = useState<string | null>(null);

  const extraerDesdePdf = async (area: string) => {
    if (!pdfUrl.trim()) {
      toast({ title: "Ingresa el link del PDF", variant: "destructive" });
      return;
    }
    setExtrayendo(area);
    try {
      const { data, error } = await supabase.functions.invoke("extraer-analisis-pdf", {
        body: {
          area,
          pdf_url: pdfUrl.trim(),
          lote_context: {
            nombre: loteContext?.nombre_lote,
            ciudad: loteContext?.ciudad,
            area_m2: loteContext?.area_total_m2,
          },
        },
      });
      if (error || !data?.success) {
        throw new Error(data?.error || "Error al procesar el PDF");
      }
      setDatosExtraidos((prev) => ({ ...prev, [area]: data.datos }));
      toast({
        title: "Extracción completada",
        description: "Revisa los datos y confirma antes de guardar",
      });
      setShowPdfInput(null);
      setPdfUrl("");
    } catch (err: any) {
      toast({
        title: "Error al extraer",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setExtrayendo(null);
    }
  };

  const makePdfProps = (areaKey: string): PdfProps => ({
    areaKey,
    showPdfInput,
    setShowPdfInput,
    pdfUrl,
    setPdfUrl,
    extrayendo,
    extraerDesdePdf,
    datosExtraidos,
    setDatosExtraidos,
  });

  const extractedCount = Object.values(datosExtraidos).filter(
    (d) => d && Object.values(d).some((v) => v !== null),
  ).length;

  const resetExtracted = () => setDatosExtraidos({});

  return {
    pdfUrl,
    setPdfUrl,
    showPdfInput,
    setShowPdfInput,
    extrayendo,
    datosExtraidos,
    setDatosExtraidos,
    extraerDesdePdf,
    makePdfProps,
    extractedCount,
    resetExtracted,
  };
};
