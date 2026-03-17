import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

/* ─── helpers ──────────────────────────────────── */

const toBool = (val: any): boolean | null => {
  if (val == null || val === "") return null;
  const v = String(val).toLowerCase().trim();
  if (v === "sí" || v === "si" || v === "x" || v === "true" || v === "1") return true;
  if (v === "no" || v === "false" || v === "0") return false;
  return null;
};

const toNum = (val: any): number | null => {
  if (val == null || val === "") return null;
  const n = typeof val === "string"
    ? parseFloat(val.replace(/,/g, ".").replace(/[^\d.\-]/g, ""))
    : Number(val);
  return isNaN(n) ? null : n;
};

const toInt = (val: any): number | null => {
  const n = toNum(val);
  return n != null ? Math.round(n) : null;
};

const toStr = (val: any): string | null => {
  if (val == null || val === "") return null;
  return String(val).trim();
};

/** Read cell value from a sheet by "C12" style address */
const cell = (ws: XLSX.WorkSheet, addr: string): any => {
  const c = ws[addr];
  return c ? c.v : null;
};

/** Get the last non-empty cell in column C */
const lastCellColC = (ws: XLSX.WorkSheet): any => {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = range.e.r; r >= 0; r--) {
    const c = ws[XLSX.utils.encode_cell({ r, c: 2 })];
    if (c && c.v != null && String(c.v).trim() !== "") return c.v;
  }
  return null;
};

/** Filter out null/undefined/"" values from an object */
const cleanPayload = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null && v !== "") result[k] = v;
  }
  return result;
};

/* ─── Sheet readers ────────────────────────────── */

function readNormativo(ws: XLSX.WorkSheet) {
  const usosRaw = toStr(cell(ws, "C8"));
  return cleanPayload({
    uso_principal: toStr(cell(ws, "C7")),
    usos_compatibles: usosRaw ? usosRaw.split(",").map((s: string) => s.trim()) : null,
    indice_construccion: toNum(cell(ws, "C9")),
    indice_ocupacion: toNum(cell(ws, "C10")),
    altura_max_pisos: toInt(cell(ws, "C11")),
    altura_max_metros: toNum(cell(ws, "C12")),
    aislamiento_frontal_m: toNum(cell(ws, "C13")),
    aislamiento_posterior_m: toNum(cell(ws, "C14")),
    aislamiento_lateral_m: toNum(cell(ws, "C15")),
    zona_pot: toStr(cell(ws, "C16")),
    tratamiento: toStr(cell(ws, "C17")),
    norma_vigente: toStr(cell(ws, "C18")),
    cesion_tipo_a_pct: toNum(cell(ws, "C19")),
  });
}

function readJuridico(ws: XLSX.WorkSheet) {
  return cleanPayload({
    cadena_tradicion: toStr(cell(ws, "C9")),
    hipoteca_activa: toBool(cell(ws, "C12")),
    servidumbres: toBool(cell(ws, "C14")),
    deuda_predial: toBool(cell(ws, "C18")) != null ? !toBool(cell(ws, "C18")) : null, // predial_al_dia inverted
    discrepancia_areas: toBool(cell(ws, "C22")) != null ? !toBool(cell(ws, "C22")) : null, // areas_coinciden inverted
    proceso_sucesion: toBool(cell(ws, "C24")),
    litigio_activo: toBool(cell(ws, "C23")),
    gravamenes: toBool(cell(ws, "C13")), // embargo_activo maps to gravamenes
    observaciones: toStr(lastCellColC(ws)),
  });
}

function readAmbiental(ws: XLSX.WorkSheet) {
  return cleanPayload({
    ronda_hidrica: toBool(cell(ws, "C7")),
    distancia_ronda_m: toNum(cell(ws, "C8")),
    reserva_forestal: toBool(cell(ws, "C9")),
    amenaza_inundacion: toStr(cell(ws, "C12")),
    amenaza_remocion: toStr(cell(ws, "C13")),
    pasivo_ambiental: toBool(cell(ws, "C17")),
    requiere_licencia_ambiental: toBool(cell(ws, "C20")),
    observaciones: toStr(lastCellColC(ws)),
  });
}

function readSSPP(ws: XLSX.WorkSheet) {
  return cleanPayload({
    acueducto_disponible: toBool(cell(ws, "C7")),
    alcantarillado_disponible: toBool(cell(ws, "C8")),
    energia_disponible: toBool(cell(ws, "C9")),
    gas_disponible: toBool(cell(ws, "C10")),
    capacidad_red_kva: toNum(cell(ws, "C14")),
    distancia_red_matriz_m: toNum(cell(ws, "C17")),
    costo_extension_estimado: toNum(cell(ws, "C19")),
    via_pavimentada: toBool(cell(ws, "C22")),
    observaciones: toStr(lastCellColC(ws)),
  });
}

function readSuelos(ws: XLSX.WorkSheet) {
  return cleanPayload({
    tipo_suelo: toStr(cell(ws, "C7")),
    capacidad_portante_ton_m2: toNum(cell(ws, "C9")),
    nivel_freatico_m: toNum(cell(ws, "C10")),
    pendiente_pct: toNum(cell(ws, "C12")),
    sistema_cimentacion: toStr(cell(ws, "C17")),
    sobrecosto_cimentacion_estimado: toNum(cell(ws, "C19")),
    observaciones: toStr(lastCellColC(ws)),
  });
}

function readMercado(ws: XLSX.WorkSheet) {
  return cleanPayload({
    precio_venta_m2_zona: toNum(cell(ws, "C7")),
    precio_unidad_promedio: toNum(cell(ws, "C21")) ?? toNum(cell(ws, "C8")),
    proyectos_competidores: toInt(cell(ws, "C13")),
    velocidad_absorcion_unidades_mes: toNum(cell(ws, "C18")),
    perfil_comprador: toStr(cell(ws, "C20")),
    valorizacion_anual_pct: toNum(cell(ws, "C23")),
    observaciones: toStr(lastCellColC(ws)),
  });
}

function readArquitectonico(ws: XLSX.WorkSheet) {
  return cleanPayload({
    m2_construibles_total: toNum(cell(ws, "C9")),
    unidades_estimadas: toInt(cell(ws, "C15")),
    area_vendible_pct: toNum(cell(ws, "C11")),
    tipologias: toStr(cell(ws, "C13")),
    eficiencia_lote_pct: toNum(cell(ws, "C11")),
    forma_lote: toStr(cell(ws, "C19")),
    permite_sotano: toBool(cell(ws, "C23")),
    observaciones: toStr(lastCellColC(ws)),
  });
}

function readFinanciero(ws: XLSX.WorkSheet) {
  return cleanPayload({
    valor_compra_lote: toNum(cell(ws, "C7")),
    costo_construccion_m2: toNum(cell(ws, "C12")),
    ingresos_proyectados: toNum(cell(ws, "C22")),
    margen_bruto_pct: toNum(cell(ws, "C25")),
    tir_pct: toNum(cell(ws, "C26")),
    vpn: toNum(cell(ws, "C27")),
    punto_equilibrio_pct: toNum(cell(ws, "C28")),
    observaciones: toStr(lastCellColC(ws)),
  });
}

/* ─── Component ────────────────────────────────── */

interface ImportResult {
  loteNombre: string;
  areas: { name: string; fields: number }[];
}

const ExcelAnalisisImporter = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    loteId: string;
    loteName: string;
    wb: XLSX.WorkBook;
  } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const data = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(data, { type: "array" });

    // Find the import sheet
    const importSheet = wb.Sheets["Importar a 360 Lateral"];
    if (!importSheet) {
      toast({
        title: "Hoja no encontrada",
        description: 'No se encontró la hoja "Importar a 360 Lateral" en el archivo.',
        variant: "destructive",
      });
      return;
    }

    const nombre_excel = toStr(cell(importSheet, "C12"));
    if (!nombre_excel) {
      toast({
        title: "Nombre no encontrado",
        description: 'La celda C12 de "Importar a 360 Lateral" está vacía.',
        variant: "destructive",
      });
      return;
    }

    // Find lote
    const { data: loteEncontrado } = await supabase
      .from("lotes")
      .select("id, nombre_lote")
      .ilike("nombre_lote", nombre_excel.trim())
      .maybeSingle();

    if (!loteEncontrado) {
      toast({
        title: "Lote no encontrado",
        description: `No existe ningún lote con el nombre "${nombre_excel}" en la plataforma. Verifica el nombre en la hoja "Importar a 360 Lateral" celda C12.`,
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({ loteId: loteEncontrado.id, loteName: loteEncontrado.nombre_lote, wb });
  }, [toast]);

  const handleConfirm = useCallback(async () => {
    if (!confirmDialog) return;
    const { loteId, loteName, wb } = confirmDialog;
    setConfirmDialog(null);
    setImporting(true);

    try {
      const sheetMap: { sheetName: string; table: string; label: string; reader: (ws: XLSX.WorkSheet) => Record<string, any> }[] = [
        { sheetName: "1. Normativo", table: "normativa_urbana", label: "Normativo", reader: readNormativo },
        { sheetName: "2. Jurídico", table: "analisis_juridico", label: "Jurídico", reader: readJuridico },
        { sheetName: "3. Ambiental", table: "analisis_ambiental", label: "Ambiental", reader: readAmbiental },
        { sheetName: "4. SSPP", table: "analisis_sspp", label: "SSPP", reader: readSSPP },
        { sheetName: "5. Suelos", table: "analisis_geotecnico", label: "Suelos", reader: readSuelos },
        { sheetName: "6. Mercado", table: "analisis_mercado", label: "Mercado", reader: readMercado },
        { sheetName: "7. Arquitectónico", table: "analisis_arquitectonico", label: "Arquitectónico", reader: readArquitectonico },
        { sheetName: "8. Financiero", table: "analisis_financiero", label: "Financiero", reader: readFinanciero },
      ];

      const areas: { name: string; fields: number }[] = [];

      for (const { sheetName, table, label, reader } of sheetMap) {
        const ws = wb.Sheets[sheetName];
        if (!ws) continue;

        const payload = reader(ws);
        const fieldCount = Object.keys(payload).length;
        if (fieldCount === 0) continue;

        // Upsert: check if exists first
        const { data: existing } = await supabase
          .from(table as any)
          .select("id")
          .eq("lote_id", loteId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from(table as any)
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq("id", (existing as any).id);
        } else {
          await supabase
            .from(table as any)
            .insert({ ...payload, lote_id: loteId });
        }

        areas.push({ name: label, fields: fieldCount });
      }

      // Invalidate all analysis queries
      qc.invalidateQueries({ queryKey: ["analisis"] });
      for (const { table } of sheetMap) {
        qc.invalidateQueries({ queryKey: [`analisis-${table.replace("analisis_", "").replace("normativa_urbana", "normativa")}`] });
      }

      setResult({ loteNombre: loteName, areas });
      toast({
        title: "✓ Análisis importado correctamente",
        description: `Lote: ${loteName}\nÁreas importadas: ${areas.map((a) => a.name).join(", ")}`,
      });
    } catch (e: any) {
      toast({ title: "Error al importar", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }, [confirmDialog, toast, qc]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
      >
        <Upload className="mr-2 h-4 w-4" />
        {importing ? "Importando…" : "Importar desde Excel"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Confirmation dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importación</DialogTitle>
            <DialogDescription>
              Se importará el análisis al lote:{" "}
              <strong>{confirmDialog?.loteName}</strong>
              <br />
              ¿Es correcto?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button onClick={handleConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result summary */}
      {result && (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <Collapsible open={resultOpen} onOpenChange={setResultOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center gap-2 text-left">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="flex-1 font-body text-sm font-semibold text-foreground">
                  Importación completada — {result.loteNombre}
                </span>
                <Badge variant="secondary" className="text-xs">{result.areas.length} áreas</Badge>
                {resultOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-1">
              {result.areas.map((a) => (
                <div key={a.name} className="flex items-center justify-between font-body text-sm">
                  <span className="text-foreground">{a.name}</span>
                  <Badge variant="disponible" className="text-[10px]">{a.fields} campos</Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </>
  );
};

export default ExcelAnalisisImporter;
