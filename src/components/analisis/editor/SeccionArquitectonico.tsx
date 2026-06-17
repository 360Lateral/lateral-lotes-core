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
  PdfExtractToggle, PdfExtractPanel, Sugerencia, Field, CheckField,
  useAutoMergePdfData,
  type SeccionProps,
} from "@/components/analisis/editor/_shared";
import { useAnalisisUpsert } from "@/hooks/analisis/useAnalisisUpsert";
/* ─── Section 7: Arquitectónico ───────────────── */
export default function SeccionArquitectonico({ loteId, pdfProps, qk: qkProp, onSaved }: SeccionProps & { lat?: number | null; lng?: number | null }) {
  const qk = qkProp ?? ["analisis-arquitectonico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_arquitectonico").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_arquitectonico", loteId, qk, onSaved);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("arquitectonico", pdfProps, setForm);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PdfExtractToggle areaKey="arquitectonico" pdfProps={pdfProps} />
      </div>
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
    </div>
  );
}
