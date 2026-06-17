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
/* ─── Section 6: Mercado ──────────────────────── */
export default function SeccionMercado({ loteId, pdfProps, qk: qkProp, onSaved }: SeccionProps & { lat?: number | null; lng?: number | null }) {
  const qk = qkProp ?? ["analisis-mercado", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_mercado").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_mercado", loteId, qk, onSaved);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("mercado", pdfProps, setForm);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PdfExtractToggle areaKey="mercado" pdfProps={pdfProps} />
      </div>
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
    </div>
  );
}
