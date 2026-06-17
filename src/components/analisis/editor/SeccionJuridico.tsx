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
/* ─── Section 2: Jurídico ─────────────────────── */
export default function SeccionJuridico({ loteId, pdfProps, qk: qkProp, onSaved }: SeccionProps & { lat?: number | null; lng?: number | null }) {
  const qk = qkProp ?? ["analisis-juridico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_juridico").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_juridico", loteId, qk, onSaved);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("juridico", pdfProps, setForm);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PdfExtractToggle areaKey="juridico" pdfProps={pdfProps} />
      </div>
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
    </div>
  );
}
