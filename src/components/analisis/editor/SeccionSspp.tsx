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
/* ─── Section 4: SSPP ─────────────────────────── */
export default function SeccionSspp({ loteId, pdfProps, defaultOpen, qk: qkProp, onSaved }: SeccionProps & { lat?: number | null; lng?: number | null }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const qk = qkProp ?? ["analisis-sspp", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_sspp").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_sspp", loteId, qk, onSaved);
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
}
