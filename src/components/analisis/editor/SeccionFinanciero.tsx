import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Scale, Leaf, Zap, Mountain, TrendingUp, Building2, DollarSign, FileText,
  FileUp, Loader2, Sparkles, MapPin, Info,
} from "lucide-react";
import {
  SectionHeader, PdfExtractPanel, Sugerencia, Field, CheckField,
  useAutoMergePdfData, POT_FIELDS,
  type SeccionProps,
} from "@/components/analisis/editor/_shared";
import { useAnalisisUpsert } from "@/hooks/analisis/useAnalisisUpsert";
/* ─── Section 8: Financiero ───────────────────── */
const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

export default function SeccionFinanciero({ loteId, pdfProps, defaultOpen, qk: qkProp, onSaved }: SeccionProps & { lat?: number | null; lng?: number | null }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const qk = qkProp ?? ["analisis-financiero", loteId];
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
  const upsert = useAnalisisUpsert("analisis_financiero", loteId, qk, onSaved);
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
