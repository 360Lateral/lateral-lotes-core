import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronDown, ChevronRight,
  Scale, Leaf, Zap, Mountain, TrendingUp, Building2, DollarSign, FileText,
  FileUp, Loader2, Sparkles,
} from "lucide-react";
import ExcelAnalisisImporter from "@/components/ExcelAnalisisImporter";
import ExcelAnalisisExporter from "@/components/ExcelAnalisisExporter";

/* ─── helpers ──────────────────────────────────── */

interface PdfProps {
  areaKey: string;
  showPdfInput: string | null;
  setShowPdfInput: (v: string | null) => void;
  pdfUrl: string;
  setPdfUrl: (v: string) => void;
  extrayendo: string | null;
  extraerDesdePdf: (area: string) => void;
  datosExtraidos: Record<string, any>;
  setDatosExtraidos: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

/* Auto-merge extracted PDF data into form state + track which fields came from PDF */
function useAutoMergePdfData(
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

    const nonNullEntries = Object.entries(datos).filter(([, v]) => v !== null && v !== undefined);
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

const SectionHeader = ({ icon: Icon, label, completed, open, areaKey, pdfProps }: {
  icon: any; label: string; completed: boolean; open: boolean;
  areaKey?: string; pdfProps?: PdfProps;
}) => (
  <div className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-body text-sm font-semibold text-foreground">{label}</span>
      <Badge variant={completed ? "disponible" : "secondary"} className="text-[10px]">
        {completed ? "Completado" : "Pendiente"}
      </Badge>
      {pdfProps && areaKey && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-orange-600 hover:bg-orange-50"
          onClick={(e) => {
            e.stopPropagation();
            pdfProps.setShowPdfInput(pdfProps.showPdfInput === areaKey ? null : areaKey);
          }}
        >
          <FileUp className="h-3 w-3 mr-1" />
          PDF Drive
        </Button>
      )}
    </div>
    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
  </div>
);

const PdfExtractPanel = ({ pdfProps }: { pdfProps: PdfProps }) => {
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

const Sugerencia = ({ areaKey, campo, pdfProps, onApply }: {
  areaKey: string; campo: string;
  pdfProps: PdfProps; onApply: (value: any) => void;
}) => {
  const value = pdfProps.datosExtraidos[areaKey]?.[campo];
  if (value === null || value === undefined) return null;
  const displayVal = typeof value === "boolean" ? (value ? "Sí" : "No") : String(value);
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[10px] text-orange-600">
        Sugerido: {displayVal}
      </span>
      <button
        type="button"
        className="text-[10px] text-primary underline"
        onClick={() => {
          onApply(value);
          pdfProps.setDatosExtraidos(prev => ({
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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <Label className="font-body text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const CheckField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
    <span className="font-body text-sm text-foreground">{label}</span>
  </label>
);

/* ─── main page ────────────────────────────────── */
const DashboardLoteAnalisis = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: lote, isLoading: loadingLote } = useQuery({
    queryKey: ["analisis-lote", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lotes").select("nombre_lote, ciudad, area_total_m2").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // PDF extraction state
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
            nombre: lote?.nombre_lote,
            ciudad: lote?.ciudad,
            area_m2: lote?.area_total_m2,
          },
        },
      });
      if (error || !data?.success) {
        throw new Error(data?.error || "Error al procesar el PDF");
      }
      setDatosExtraidos(prev => ({ ...prev, [area]: data.datos }));
      toast({ title: "Extracción completada", description: "Revisa los datos y confirma antes de guardar" });
      setShowPdfInput(null);
      setPdfUrl("");
    } catch (err: any) {
      toast({ title: "Error al extraer", description: err.message, variant: "destructive" });
    } finally {
      setExtrayendo(null);
    }
  };

  const makePdfProps = (areaKey: string): PdfProps => ({
    areaKey, showPdfInput, setShowPdfInput, pdfUrl, setPdfUrl,
    extrayendo, extraerDesdePdf, datosExtraidos, setDatosExtraidos,
  });

  if (loadingLote) {
    return <DashboardLayout><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-96" /></DashboardLayout>;
  }

  const extractedCount = Object.values(datosExtraidos).filter(d => d && Object.values(d).some(v => v !== null)).length;

  return (
    <DashboardLayout>
      <Link to="/dashboard/lotes" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Volver a lotes
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-foreground">
          Análisis 360° — {lote?.nombre_lote ?? "Lote"}
        </h1>
        <div className="flex items-center gap-2">
          <ExcelAnalisisExporter loteId={id!} />
          <ExcelAnalisisImporter />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <NormativaSection loteId={id!} pdfProps={makePdfProps("normativo")} />
        <JuridicoSection loteId={id!} pdfProps={makePdfProps("juridico")} />
        <AmbientalSection loteId={id!} pdfProps={makePdfProps("ambiental")} />
        <SSPPSection loteId={id!} pdfProps={makePdfProps("sspp")} />
        <SuelosSection loteId={id!} pdfProps={makePdfProps("geotecnico")} />
        <MercadoSection loteId={id!} pdfProps={makePdfProps("mercado")} />
        <ArquitectonicoSection loteId={id!} pdfProps={makePdfProps("arquitectonico")} />
        <FinancieroSection loteId={id!} pdfProps={makePdfProps("financiero")} />
      </div>

      {extractedCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => {
              // Data is auto-merged by useAutoMergePdfData, just clear suggestions
              setDatosExtraidos({});
              toast({ title: "Datos aplicados", description: "Los datos fueron cargados en cada sección. Revisa y guarda." });
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
          >
            Aplicar {extractedCount} área(s) y limpiar sugerencias
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

/* ─── Section 1: Normativa (read-only summary + PDF) ── */
const NormativaSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-normativa", loteId];
  const { data: n } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("normativa_urbana").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (n) setForm(n); }, [n]);
  const upsert = useAnalisisUpsert("normativa_urbana", loteId, qk);
  const completed = !!n;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("normativo", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={FileText} label="Normativo" completed={completed} open={open} areaKey="normativo" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <Field label="Uso principal">
              <Input value={form.uso_principal ?? ""} onChange={(e) => set("uso_principal", e.target.value)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="uso_principal" pdfProps={pdfProps} onApply={(v) => set("uso_principal", v)} />
          </div>
          <div>
            <Field label="Índice construcción">
              <Input type="number" step="0.01" value={form.indice_construccion ?? ""} onChange={(e) => set("indice_construccion", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="indice_construccion" pdfProps={pdfProps} onApply={(v) => set("indice_construccion", v)} />
          </div>
          <div>
            <Field label="Índice ocupación">
              <Input type="number" step="0.01" value={form.indice_ocupacion ?? ""} onChange={(e) => set("indice_ocupacion", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="indice_ocupacion" pdfProps={pdfProps} onApply={(v) => set("indice_ocupacion", v)} />
          </div>
          <div>
            <Field label="Altura máx. pisos">
              <Input type="number" value={form.altura_max_pisos ?? ""} onChange={(e) => set("altura_max_pisos", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="altura_max_pisos" pdfProps={pdfProps} onApply={(v) => set("altura_max_pisos", v)} />
          </div>
          <div>
            <Field label="Altura máx. metros">
              <Input type="number" value={form.altura_max_metros ?? ""} onChange={(e) => set("altura_max_metros", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="altura_max_metros" pdfProps={pdfProps} onApply={(v) => set("altura_max_metros", v)} />
          </div>
          <div>
            <Field label="Aisl. frontal (m)">
              <Input type="number" step="0.1" value={form.aislamiento_frontal_m ?? ""} onChange={(e) => set("aislamiento_frontal_m", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="aislamiento_frontal_m" pdfProps={pdfProps} onApply={(v) => set("aislamiento_frontal_m", v)} />
          </div>
          <div>
            <Field label="Aisl. posterior (m)">
              <Input type="number" step="0.1" value={form.aislamiento_posterior_m ?? ""} onChange={(e) => set("aislamiento_posterior_m", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="aislamiento_posterior_m" pdfProps={pdfProps} onApply={(v) => set("aislamiento_posterior_m", v)} />
          </div>
          <div>
            <Field label="Aisl. lateral (m)">
              <Input type="number" step="0.1" value={form.aislamiento_lateral_m ?? ""} onChange={(e) => set("aislamiento_lateral_m", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="aislamiento_lateral_m" pdfProps={pdfProps} onApply={(v) => set("aislamiento_lateral_m", v)} />
          </div>
          <div>
            <Field label="Zona POT">
              <Input value={form.zona_pot ?? ""} onChange={(e) => set("zona_pot", e.target.value)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="zona_pot" pdfProps={pdfProps} onApply={(v) => set("zona_pot", v)} />
          </div>
          <div>
            <Field label="Tratamiento">
              <Input value={form.tratamiento ?? ""} onChange={(e) => set("tratamiento", e.target.value)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="tratamiento" pdfProps={pdfProps} onApply={(v) => set("tratamiento", v)} />
          </div>
          <div>
            <Field label="Norma vigente">
              <Input value={form.norma_vigente ?? ""} onChange={(e) => set("norma_vigente", e.target.value)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="norma_vigente" pdfProps={pdfProps} onApply={(v) => set("norma_vigente", v)} />
          </div>
          <div>
            <Field label="Cesión tipo A (%)">
              <Input type="number" step="0.1" value={form.cesion_tipo_a_pct ?? ""} onChange={(e) => set("cesion_tipo_a_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="normativo" campo="cesion_tipo_a_pct" pdfProps={pdfProps} onApply={(v) => set("cesion_tipo_a_pct", v)} />
          </div>
        </div>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
        <Sugerencia areaKey="normativo" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        <Button onClick={() => upsert.mutate({
          uso_principal: form.uso_principal || null,
          usos_compatibles: form.usos_compatibles ? (Array.isArray(form.usos_compatibles) ? form.usos_compatibles : form.usos_compatibles.split(",").map((s: string) => s.trim()).filter(Boolean)) : null,
          indice_construccion: form.indice_construccion, indice_ocupacion: form.indice_ocupacion,
          altura_max_pisos: form.altura_max_pisos, altura_max_metros: form.altura_max_metros,
          aislamiento_frontal_m: form.aislamiento_frontal_m, aislamiento_posterior_m: form.aislamiento_posterior_m,
          aislamiento_lateral_m: form.aislamiento_lateral_m, zona_pot: form.zona_pot || null,
          tratamiento: form.tratamiento || null, norma_vigente: form.norma_vigente || null,
          cesion_tipo_a_pct: form.cesion_tipo_a_pct,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Normativo"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Generic upsert hook ─────────────────────── */
function useAnalisisUpsert(table: string, loteId: string, qk: string[]) {
  const { toast } = useToast();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { data: existing } = await supabase.from(table as any).select("id").eq("lote_id", loteId).maybeSingle();
      // normativa_urbana doesn't have updated_at column
      const tablesWithUpdatedAt = ["analisis_juridico","analisis_ambiental","analisis_sspp","analisis_geotecnico","analisis_mercado","analisis_arquitectonico","analisis_financiero"];
      const payload = tablesWithUpdatedAt.includes(table)
        ? { ...values, updated_at: new Date().toISOString() }
        : { ...values };
      // Remove updated_at if it leaked into the form values for normativa_urbana
      if (!tablesWithUpdatedAt.includes(table)) delete payload.updated_at;
      if (existing) {
        const { error } = await supabase.from(table as any).update(payload).eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert({ ...payload, lote_id: loteId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Guardado correctamente" });
      qc.invalidateQueries({ queryKey: qk });
    },
    onError: (e: any) => {
      toast({ title: "Error al guardar", description: e.message, variant: "destructive" });
    },
  });
}

/* ─── Section 2: Jurídico ─────────────────────── */
const JuridicoSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-juridico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_juridico").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_juridico", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("juridico", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Scale} label="Jurídico" completed={completed} open={open} areaKey="juridico" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div>
          <Field label="Cadena de tradición">
            <Select value={form.cadena_tradicion ?? ""} onValueChange={(v) => set("cadena_tradicion", v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="completa">Completa</SelectItem>
                <SelectItem value="incompleta">Incompleta</SelectItem>
                <SelectItem value="interrumpida">Interrumpida</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Sugerencia areaKey="juridico" campo="cadena_tradicion" pdfProps={pdfProps} onApply={(v) => set("cadena_tradicion", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CheckField label="Gravámenes" checked={!!form.gravamenes} onChange={(v) => set("gravamenes", v)} />
            <Sugerencia areaKey="juridico" campo="gravamenes" pdfProps={pdfProps} onApply={(v) => set("gravamenes", v)} />
          </div>
          <div>
            <CheckField label="Hipoteca activa" checked={!!form.hipoteca_activa} onChange={(v) => set("hipoteca_activa", v)} />
            <Sugerencia areaKey="juridico" campo="hipoteca_activa" pdfProps={pdfProps} onApply={(v) => set("hipoteca_activa", v)} />
          </div>
          <div>
            <CheckField label="Servidumbres" checked={!!form.servidumbres} onChange={(v) => set("servidumbres", v)} />
            <Sugerencia areaKey="juridico" campo="servidumbres" pdfProps={pdfProps} onApply={(v) => set("servidumbres", v)} />
          </div>
          <div>
            <CheckField label="Deuda predial" checked={!!form.deuda_predial} onChange={(v) => set("deuda_predial", v)} />
            <Sugerencia areaKey="juridico" campo="deuda_predial" pdfProps={pdfProps} onApply={(v) => set("deuda_predial", v)} />
          </div>
          <div>
            <CheckField label="Discrepancia de áreas" checked={!!form.discrepancia_areas} onChange={(v) => set("discrepancia_areas", v)} />
            <Sugerencia areaKey="juridico" campo="discrepancia_areas" pdfProps={pdfProps} onApply={(v) => set("discrepancia_areas", v)} />
          </div>
          <div>
            <CheckField label="Proceso sucesión" checked={!!form.proceso_sucesion} onChange={(v) => set("proceso_sucesion", v)} />
            <Sugerencia areaKey="juridico" campo="proceso_sucesion" pdfProps={pdfProps} onApply={(v) => set("proceso_sucesion", v)} />
          </div>
          <div>
            <CheckField label="Litigio activo" checked={!!form.litigio_activo} onChange={(v) => set("litigio_activo", v)} />
            <Sugerencia areaKey="juridico" campo="litigio_activo" pdfProps={pdfProps} onApply={(v) => set("litigio_activo", v)} />
          </div>
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="juridico" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          cadena_tradicion: form.cadena_tradicion, gravamenes: form.gravamenes, hipoteca_activa: form.hipoteca_activa,
          servidumbres: form.servidumbres, deuda_predial: form.deuda_predial, discrepancia_areas: form.discrepancia_areas,
          proceso_sucesion: form.proceso_sucesion, litigio_activo: form.litigio_activo, observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Jurídico"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Section 3: Ambiental ────────────────────── */
const AmbientalSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-ambiental", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_ambiental").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_ambiental", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("ambiental", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Leaf} label="Ambiental" completed={completed} open={open} areaKey="ambiental" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CheckField label="Ronda hídrica" checked={!!form.ronda_hidrica} onChange={(v) => set("ronda_hidrica", v)} />
            <Sugerencia areaKey="ambiental" campo="ronda_hidrica" pdfProps={pdfProps} onApply={(v) => set("ronda_hidrica", v)} />
          </div>
          <div>
            <CheckField label="Reserva forestal" checked={!!form.reserva_forestal} onChange={(v) => set("reserva_forestal", v)} />
            <Sugerencia areaKey="ambiental" campo="reserva_forestal" pdfProps={pdfProps} onApply={(v) => set("reserva_forestal", v)} />
          </div>
          <div>
            <CheckField label="Pasivo ambiental" checked={!!form.pasivo_ambiental} onChange={(v) => set("pasivo_ambiental", v)} />
            <Sugerencia areaKey="ambiental" campo="pasivo_ambiental" pdfProps={pdfProps} onApply={(v) => set("pasivo_ambiental", v)} />
          </div>
          <div>
            <CheckField label="Requiere licencia ambiental" checked={!!form.requiere_licencia_ambiental} onChange={(v) => set("requiere_licencia_ambiental", v)} />
            <Sugerencia areaKey="ambiental" campo="requiere_licencia_ambiental" pdfProps={pdfProps} onApply={(v) => set("requiere_licencia_ambiental", v)} />
          </div>
        </div>
        {form.ronda_hidrica && (
          <div>
            <Field label="Distancia ronda (m)">
              <Input type="number" value={form.distancia_ronda_m ?? ""} onChange={(e) => set("distancia_ronda_m", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="ambiental" campo="distancia_ronda_m" pdfProps={pdfProps} onApply={(v) => set("distancia_ronda_m", v)} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Field label="Amenaza inundación">
              <Select value={form.amenaza_inundacion ?? "sin_amenaza"} onValueChange={(v) => set("amenaza_inundacion", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_amenaza">Sin amenaza</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Sugerencia areaKey="ambiental" campo="amenaza_inundacion" pdfProps={pdfProps} onApply={(v) => set("amenaza_inundacion", v)} />
          </div>
          <div>
            <Field label="Amenaza remoción">
              <Select value={form.amenaza_remocion ?? "sin_amenaza"} onValueChange={(v) => set("amenaza_remocion", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_amenaza">Sin amenaza</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Sugerencia areaKey="ambiental" campo="amenaza_remocion" pdfProps={pdfProps} onApply={(v) => set("amenaza_remocion", v)} />
          </div>
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="ambiental" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          ronda_hidrica: form.ronda_hidrica, distancia_ronda_m: form.distancia_ronda_m,
          reserva_forestal: form.reserva_forestal, amenaza_inundacion: form.amenaza_inundacion,
          amenaza_remocion: form.amenaza_remocion, pasivo_ambiental: form.pasivo_ambiental,
          requiere_licencia_ambiental: form.requiere_licencia_ambiental, observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Ambiental"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Section 4: SSPP ─────────────────────────── */
const SSPPSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-sspp", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_sspp").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_sspp", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("sspp", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Zap} label="SSPP" completed={completed} open={open} areaKey="sspp" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <CheckField label="Acueducto" checked={!!form.acueducto_disponible} onChange={(v) => set("acueducto_disponible", v)} />
            <Sugerencia areaKey="sspp" campo="acueducto_disponible" pdfProps={pdfProps} onApply={(v) => set("acueducto_disponible", v)} />
          </div>
          <div>
            <CheckField label="Alcantarillado" checked={!!form.alcantarillado_disponible} onChange={(v) => set("alcantarillado_disponible", v)} />
            <Sugerencia areaKey="sspp" campo="alcantarillado_disponible" pdfProps={pdfProps} onApply={(v) => set("alcantarillado_disponible", v)} />
          </div>
          <div>
            <CheckField label="Energía" checked={!!form.energia_disponible} onChange={(v) => set("energia_disponible", v)} />
            <Sugerencia areaKey="sspp" campo="energia_disponible" pdfProps={pdfProps} onApply={(v) => set("energia_disponible", v)} />
          </div>
          <div>
            <CheckField label="Gas" checked={!!form.gas_disponible} onChange={(v) => set("gas_disponible", v)} />
            <Sugerencia areaKey="sspp" campo="gas_disponible" pdfProps={pdfProps} onApply={(v) => set("gas_disponible", v)} />
          </div>
          <div>
            <CheckField label="Vía pavimentada" checked={!!form.via_pavimentada} onChange={(v) => set("via_pavimentada", v)} />
            <Sugerencia areaKey="sspp" campo="via_pavimentada" pdfProps={pdfProps} onApply={(v) => set("via_pavimentada", v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <Field label="Capacidad red (kVA)">
              <Input type="number" value={form.capacidad_red_kva ?? ""} onChange={(e) => set("capacidad_red_kva", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="sspp" campo="capacidad_red_kva" pdfProps={pdfProps} onApply={(v) => set("capacidad_red_kva", v)} />
          </div>
          <div>
            <Field label="Distancia red matriz (m)">
              <Input type="number" value={form.distancia_red_matriz_m ?? ""} onChange={(e) => set("distancia_red_matriz_m", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="sspp" campo="distancia_red_matriz_m" pdfProps={pdfProps} onApply={(v) => set("distancia_red_matriz_m", v)} />
          </div>
          <div>
            <Field label="Costo extensión estimado (COP)">
              <Input type="number" value={form.costo_extension_estimado ?? ""} onChange={(e) => set("costo_extension_estimado", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="sspp" campo="costo_extension_estimado" pdfProps={pdfProps} onApply={(v) => set("costo_extension_estimado", v)} />
          </div>
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="sspp" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          acueducto_disponible: form.acueducto_disponible, alcantarillado_disponible: form.alcantarillado_disponible,
          energia_disponible: form.energia_disponible, gas_disponible: form.gas_disponible,
          capacidad_red_kva: form.capacidad_red_kva, distancia_red_matriz_m: form.distancia_red_matriz_m,
          costo_extension_estimado: form.costo_extension_estimado, via_pavimentada: form.via_pavimentada,
          observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar SSPP"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Section 5: Suelos (geotécnico) ──────────── */
const SuelosSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-geotecnico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_geotecnico").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_geotecnico", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("geotecnico", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Mountain} label="Suelos" completed={completed} open={open} areaKey="geotecnico" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Field label="Tipo de suelo">
              <Select value={form.tipo_suelo ?? ""} onValueChange={(v) => set("tipo_suelo", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cohesivo">Cohesivo</SelectItem>
                  <SelectItem value="granular">Granular</SelectItem>
                  <SelectItem value="roca">Roca</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Sugerencia areaKey="geotecnico" campo="tipo_suelo" pdfProps={pdfProps} onApply={(v) => set("tipo_suelo", v)} />
          </div>
          <div>
            <Field label="Sistema cimentación">
              <Select value={form.sistema_cimentacion ?? ""} onValueChange={(v) => set("sistema_cimentacion", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superficial">Superficial</SelectItem>
                  <SelectItem value="profunda">Profunda</SelectItem>
                  <SelectItem value="pilotes">Pilotes</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Sugerencia areaKey="geotecnico" campo="sistema_cimentacion" pdfProps={pdfProps} onApply={(v) => set("sistema_cimentacion", v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <Field label="Capacidad portante (ton/m²)">
              <Input type="number" value={form.capacidad_portante_ton_m2 ?? ""} onChange={(e) => set("capacidad_portante_ton_m2", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="geotecnico" campo="capacidad_portante_ton_m2" pdfProps={pdfProps} onApply={(v) => set("capacidad_portante_ton_m2", v)} />
          </div>
          <div>
            <Field label="Nivel freático (m)">
              <Input type="number" value={form.nivel_freatico_m ?? ""} onChange={(e) => set("nivel_freatico_m", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="geotecnico" campo="nivel_freatico_m" pdfProps={pdfProps} onApply={(v) => set("nivel_freatico_m", v)} />
          </div>
          <div>
            <Field label="Pendiente (%)">
              <Input type="number" value={form.pendiente_pct ?? ""} onChange={(e) => set("pendiente_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="geotecnico" campo="pendiente_pct" pdfProps={pdfProps} onApply={(v) => set("pendiente_pct", v)} />
          </div>
        </div>
        <div>
          <Field label="Sobrecosto cimentación estimado (COP)">
            <Input type="number" value={form.sobrecosto_cimentacion_estimado ?? ""} onChange={(e) => set("sobrecosto_cimentacion_estimado", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Sugerencia areaKey="geotecnico" campo="sobrecosto_cimentacion_estimado" pdfProps={pdfProps} onApply={(v) => set("sobrecosto_cimentacion_estimado", v)} />
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="geotecnico" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          tipo_suelo: form.tipo_suelo, capacidad_portante_ton_m2: form.capacidad_portante_ton_m2,
          nivel_freatico_m: form.nivel_freatico_m, pendiente_pct: form.pendiente_pct,
          sistema_cimentacion: form.sistema_cimentacion, sobrecosto_cimentacion_estimado: form.sobrecosto_cimentacion_estimado,
          observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Suelos"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Section 6: Mercado ──────────────────────── */
const MercadoSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-mercado", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_mercado").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_mercado", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("mercado", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={TrendingUp} label="Mercado" completed={completed} open={open} areaKey="mercado" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Field label="Precio venta m² zona (COP)">
              <Input type="number" value={form.precio_venta_m2_zona ?? ""} onChange={(e) => set("precio_venta_m2_zona", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="mercado" campo="precio_venta_m2_zona" pdfProps={pdfProps} onApply={(v) => set("precio_venta_m2_zona", v)} />
          </div>
          <div>
            <Field label="Precio unidad promedio (COP)">
              <Input type="number" value={form.precio_unidad_promedio ?? ""} onChange={(e) => set("precio_unidad_promedio", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="mercado" campo="precio_unidad_promedio" pdfProps={pdfProps} onApply={(v) => set("precio_unidad_promedio", v)} />
          </div>
          <div>
            <Field label="Proyectos competidores">
              <Input type="number" value={form.proyectos_competidores ?? ""} onChange={(e) => set("proyectos_competidores", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="mercado" campo="proyectos_competidores" pdfProps={pdfProps} onApply={(v) => set("proyectos_competidores", v)} />
          </div>
          <div>
            <Field label="Velocidad absorción (und/mes)">
              <Input type="number" value={form.velocidad_absorcion_unidades_mes ?? ""} onChange={(e) => set("velocidad_absorcion_unidades_mes", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="mercado" campo="velocidad_absorcion_unidades_mes" pdfProps={pdfProps} onApply={(v) => set("velocidad_absorcion_unidades_mes", v)} />
          </div>
        </div>
        <div>
          <Field label="Perfil comprador">
            <Select value={form.perfil_comprador ?? ""} onValueChange={(v) => set("perfil_comprador", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VIS">VIS</SelectItem>
                <SelectItem value="No VIS">No VIS</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Sugerencia areaKey="mercado" campo="perfil_comprador" pdfProps={pdfProps} onApply={(v) => set("perfil_comprador", v)} />
        </div>
        <div>
          <Field label="Valorización anual (%)">
            <Input type="number" value={form.valorizacion_anual_pct ?? ""} onChange={(e) => set("valorizacion_anual_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Sugerencia areaKey="mercado" campo="valorizacion_anual_pct" pdfProps={pdfProps} onApply={(v) => set("valorizacion_anual_pct", v)} />
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="mercado" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          precio_venta_m2_zona: form.precio_venta_m2_zona, precio_unidad_promedio: form.precio_unidad_promedio,
          proyectos_competidores: form.proyectos_competidores, velocidad_absorcion_unidades_mes: form.velocidad_absorcion_unidades_mes,
          perfil_comprador: form.perfil_comprador, valorizacion_anual_pct: form.valorizacion_anual_pct,
          observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Mercado"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Section 7: Arquitectónico ───────────────── */
const ArquitectonicoSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-arquitectonico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_arquitectonico").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_arquitectonico", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("arquitectonico", pdfProps, setForm);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Building2} label="Arquitectónico" completed={completed} open={open} areaKey="arquitectonico" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Field label="m² construibles total">
              <Input type="number" value={form.m2_construibles_total ?? ""} onChange={(e) => set("m2_construibles_total", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="arquitectonico" campo="m2_construibles_total" pdfProps={pdfProps} onApply={(v) => set("m2_construibles_total", v)} />
          </div>
          <div>
            <Field label="Unidades estimadas">
              <Input type="number" value={form.unidades_estimadas ?? ""} onChange={(e) => set("unidades_estimadas", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="arquitectonico" campo="unidades_estimadas" pdfProps={pdfProps} onApply={(v) => set("unidades_estimadas", v)} />
          </div>
          <div>
            <Field label="Área vendible (%)">
              <Input type="number" value={form.area_vendible_pct ?? ""} onChange={(e) => set("area_vendible_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="arquitectonico" campo="area_vendible_pct" pdfProps={pdfProps} onApply={(v) => set("area_vendible_pct", v)} />
          </div>
          <div>
            <Field label="Eficiencia lote (%)">
              <Input type="number" value={form.eficiencia_lote_pct ?? ""} onChange={(e) => set("eficiencia_lote_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="arquitectonico" campo="eficiencia_lote_pct" pdfProps={pdfProps} onApply={(v) => set("eficiencia_lote_pct", v)} />
          </div>
        </div>
        <div>
          <Field label="Tipologías posibles">
            <Input value={form.tipologias ?? ""} onChange={(e) => set("tipologias", e.target.value)} />
          </Field>
          <Sugerencia areaKey="arquitectonico" campo="tipologias" pdfProps={pdfProps} onApply={(v) => set("tipologias", v)} />
        </div>
        <div>
          <Field label="Forma del lote">
            <Select value={form.forma_lote ?? ""} onValueChange={(v) => set("forma_lote", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
                <SelectItem value="esquinero">Esquinero</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Sugerencia areaKey="arquitectonico" campo="forma_lote" pdfProps={pdfProps} onApply={(v) => set("forma_lote", v)} />
        </div>
        <div>
          <CheckField label="Permite sótano" checked={!!form.permite_sotano} onChange={(v) => set("permite_sotano", v)} />
          <Sugerencia areaKey="arquitectonico" campo="permite_sotano" pdfProps={pdfProps} onApply={(v) => set("permite_sotano", v)} />
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="arquitectonico" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          m2_construibles_total: form.m2_construibles_total, unidades_estimadas: form.unidades_estimadas,
          area_vendible_pct: form.area_vendible_pct, tipologias: form.tipologias,
          eficiencia_lote_pct: form.eficiencia_lote_pct, forma_lote: form.forma_lote,
          permite_sotano: form.permite_sotano, observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Arquitectónico"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

/* ─── Section 8: Financiero ───────────────────── */
const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const FinancieroSection = ({ loteId, pdfProps }: { loteId: string; pdfProps: PdfProps }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-financiero", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_financiero").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const { data: loteData } = useQuery({
    queryKey: ["analisis-lote-area", loteId],
    queryFn: async () => {
      const { data } = await supabase.from("lotes").select("area_total_m2").eq("id", loteId).single();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_financiero", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("financiero", pdfProps, setForm);

  const area = loteData?.area_total_m2 ? Number(loteData.area_total_m2) : 0;
  const precioPromedio = form.precio_estimado_promedio ? Number(form.precio_estimado_promedio) : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={DollarSign} label="Financiero" completed={completed} open={open} areaKey="financiero" pdfProps={pdfProps} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <PdfExtractPanel pdfProps={pdfProps} />
        {/* Valoración estimada 360° */}
        <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 space-y-3">
          <p className="font-body text-sm font-semibold text-foreground">Valoración estimada del lote (360°)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Field label="Precio mínimo estimado (COP)">
                <Input type="number" value={form.precio_estimado_min ?? ""} onChange={(e) => set("precio_estimado_min", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Sugerencia areaKey="financiero" campo="precio_estimado_min" pdfProps={pdfProps} onApply={(v) => set("precio_estimado_min", v)} />
            </div>
            <div>
              <Field label="Precio promedio estimado (COP)">
                <Input type="number" value={form.precio_estimado_promedio ?? ""} onChange={(e) => set("precio_estimado_promedio", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Sugerencia areaKey="financiero" campo="precio_estimado_promedio" pdfProps={pdfProps} onApply={(v) => set("precio_estimado_promedio", v)} />
            </div>
            <div>
              <Field label="Precio máximo estimado (COP)">
                <Input type="number" value={form.precio_estimado_max ?? ""} onChange={(e) => set("precio_estimado_max", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Sugerencia areaKey="financiero" campo="precio_estimado_max" pdfProps={pdfProps} onApply={(v) => set("precio_estimado_max", v)} />
            </div>
          </div>
          {precioPromedio > 0 && area > 0 && (
            <p className="text-xs text-muted-foreground">
              Precio estimado por m²: {formatCOP(precioPromedio / area)} / m²
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Field label="Valor compra lote (COP)">
              <Input type="number" value={form.valor_compra_lote ?? ""} onChange={(e) => set("valor_compra_lote", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="valor_compra_lote" pdfProps={pdfProps} onApply={(v) => set("valor_compra_lote", v)} />
          </div>
          <div>
            <Field label="Costo construcción/m² (COP)">
              <Input type="number" value={form.costo_construccion_m2 ?? ""} onChange={(e) => set("costo_construccion_m2", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="costo_construccion_m2" pdfProps={pdfProps} onApply={(v) => set("costo_construccion_m2", v)} />
          </div>
          <div>
            <Field label="Ingresos proyectados (COP)">
              <Input type="number" value={form.ingresos_proyectados ?? ""} onChange={(e) => set("ingresos_proyectados", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="ingresos_proyectados" pdfProps={pdfProps} onApply={(v) => set("ingresos_proyectados", v)} />
          </div>
          <div>
            <Field label="Margen bruto (%)">
              <Input type="number" value={form.margen_bruto_pct ?? ""} onChange={(e) => set("margen_bruto_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="margen_bruto_pct" pdfProps={pdfProps} onApply={(v) => set("margen_bruto_pct", v)} />
          </div>
          <div>
            <Field label="TIR (%)">
              <Input type="number" value={form.tir_pct ?? ""} onChange={(e) => set("tir_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="tir_pct" pdfProps={pdfProps} onApply={(v) => set("tir_pct", v)} />
          </div>
          <div>
            <Field label="VPN (COP)">
              <Input type="number" value={form.vpn ?? ""} onChange={(e) => set("vpn", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="vpn" pdfProps={pdfProps} onApply={(v) => set("vpn", v)} />
          </div>
          <div>
            <Field label="Punto equilibrio (%)">
              <Input type="number" value={form.punto_equilibrio_pct ?? ""} onChange={(e) => set("punto_equilibrio_pct", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Sugerencia areaKey="financiero" campo="punto_equilibrio_pct" pdfProps={pdfProps} onApply={(v) => set("punto_equilibrio_pct", v)} />
          </div>
        </div>
        <div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="financiero" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
        </div>
        <Button onClick={() => upsert.mutate({
          precio_estimado_min: form.precio_estimado_min, precio_estimado_promedio: form.precio_estimado_promedio,
          precio_estimado_max: form.precio_estimado_max,
          valor_compra_lote: form.valor_compra_lote, costo_construccion_m2: form.costo_construccion_m2,
          ingresos_proyectados: form.ingresos_proyectados, margen_bruto_pct: form.margen_bruto_pct,
          tir_pct: form.tir_pct, vpn: form.vpn, punto_equilibrio_pct: form.punto_equilibrio_pct,
          observaciones: form.observaciones,
        })} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar Financiero"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DashboardLoteAnalisis;
