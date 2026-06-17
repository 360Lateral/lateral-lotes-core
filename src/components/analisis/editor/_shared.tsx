/**
 * Helpers compartidos del editor de Análisis 360°.
 * Extraídos de src/pages/DashboardLoteAnalisis.tsx en Fase 1.
 */
import React, { useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileUp,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PdfProps } from "@/hooks/analisis/usePdfExtractAnalisis";

export type { PdfProps };

export const PdfExtractToggle = ({
  areaKey,
  pdfProps,
}: {
  areaKey: string;
  pdfProps: PdfProps;
}) => {
  const isOpen = pdfProps.showPdfInput === areaKey;
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 px-3 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
      onClick={() => pdfProps.setShowPdfInput(isOpen ? null : areaKey)}
    >
      <FileUp className="h-3.5 w-3.5 mr-1.5" />
      {isOpen ? "Cerrar PDF" : "Extraer desde PDF"}
    </Button>
  );
};

export const PdfExtractPanel = ({ pdfProps }: { pdfProps: PdfProps }) => {
  if (pdfProps.showPdfInput !== pdfProps.areaKey) return null;
  return (
    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
      <p className="text-xs font-medium text-orange-800">
        Pega el link público de Google Drive del informe {pdfProps.areaKey}
      </p>
      <p className="text-[10px] text-orange-600">
        El PDF debe estar compartido como "Cualquiera con el enlace puede ver"
      </p>
      <Input
        value={pdfProps.pdfUrl}
        onChange={(e) => pdfProps.setPdfUrl(e.target.value)}
        placeholder="https://drive.google.com/file/d/..."
        className="text-xs w-full"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => pdfProps.extraerDesdePdf(pdfProps.areaKey)}
          disabled={pdfProps.extrayendo === pdfProps.areaKey}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {pdfProps.extrayendo === pdfProps.areaKey ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Extrayendo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Extraer con IA
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            pdfProps.setShowPdfInput(null);
            pdfProps.setPdfUrl("");
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export const Sugerencia = ({
  areaKey,
  campo,
  pdfProps,
  onApply,
}: {
  areaKey: string;
  campo: string;
  pdfProps: PdfProps;
  onApply: (value: any) => void;
}) => {
  const value = pdfProps.datosExtraidos[areaKey]?.[campo];
  if (value === null || value === undefined) return null;
  const displayVal = typeof value === "boolean" ? (value ? "Sí" : "No") : String(value);
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[10px] text-orange-600">Sugerido: {displayVal}</span>
      <button
        type="button"
        className="text-[10px] text-primary underline"
        onClick={() => {
          onApply(value);
          pdfProps.setDatosExtraidos((prev) => ({
            ...prev,
            [areaKey]: { ...prev[areaKey], [campo]: null },
          }));
        }}
      >
        Aplicar
      </button>
    </div>
  );
};

export const Field = ({
  label,
  children,
  tooltip,
}: {
  label: string;
  children: React.ReactNode;
  tooltip?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-1">
      <Label className="font-body text-xs text-muted-foreground">{label}</Label>
      {tooltip && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[200px] whitespace-pre-line text-xs bg-foreground text-background"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
  </div>
);

export const CheckField = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
    <span className="font-body text-sm text-foreground">{label}</span>
  </label>
);

/** Auto-merge PDF-extracted data into form state */
export function useAutoMergePdfData(
  areaKey: string,
  pdfProps: PdfProps,
  setForm: React.Dispatch<React.SetStateAction<any>>,
) {
  const pdfFieldsRef = useRef<Set<string>>(new Set());
  const lastMergedRef = useRef<string | null>(null);

  useEffect(() => {
    const datos = pdfProps.datosExtraidos[areaKey];
    if (!datos) return;
    const key = JSON.stringify(datos);
    if (key === lastMergedRef.current) return;
    lastMergedRef.current = key;

    const nonNullEntries = Object.entries(datos).filter(
      ([, v]) => v !== null && v !== undefined,
    );
    if (nonNullEntries.length === 0) return;

    const merged: Record<string, any> = {};
    for (const [k, v] of nonNullEntries) {
      merged[k] = v;
      pdfFieldsRef.current.add(k);
    }
    setForm((prev: any) => ({ ...prev, ...merged }));
  }, [areaKey, pdfProps.datosExtraidos, setForm]);

  const isFromPdf = (campo: string) => pdfFieldsRef.current.has(campo);
  const clearPdfField = (campo: string) => pdfFieldsRef.current.delete(campo);

  return { isFromPdf, clearPdfField };
}

/** Mapping POT → normativa_urbana fields (shared by Normativa section) */
export const POT_FIELDS: {
  key: string;
  label: string;
  potKey: string;
  isText?: boolean;
}[] = [
  { key: "uso_principal", label: "Uso principal", potKey: "uso_principal" },
  { key: "tratamiento", label: "Tratamiento", potKey: "tratamiento" },
  { key: "indice_construccion", label: "IC", potKey: "ic_texto", isText: true },
  { key: "densidad_max", label: "Densidad máx", potKey: "densidad_max" },
  { key: "altura_texto", label: "Altura normativa", potKey: "altura_texto" },
  { key: "cesion_tipo_a_pct", label: "Cesión tipo A", potKey: "cesion_tipo_a" },
  { key: "cesion_tipo_b", label: "Cesión tipo B", potKey: "cesion_tipo_b" },
  { key: "io_plataforma", label: "IO plataforma", potKey: "io" },
  { key: "io_torre", label: "IO torre", potKey: "io_torre" },
  { key: "aislamiento_frontal_m", label: "Aislamiento frontal (m)", potKey: "aislamiento_frontal_m" },
  { key: "aislamiento_posterior_m", label: "Aislamiento posterior (m)", potKey: "aislamiento_posterior_m" },
  { key: "aislamiento_lateral_m", label: "Aislamiento lateral (m)", potKey: "aislamiento_lateral_m" },
];

export interface SeccionProps {
  loteId: string;
  qk?: any[];
  pdfProps: PdfProps;
  defaultOpen?: boolean;
  /** Fase 2: render sin <Collapsible> envolvente (modo Sheet). Por ahora no-op. */
  hideCollapsible?: boolean;
  onSaved?: () => void;
}
