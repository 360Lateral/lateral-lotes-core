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

export default
