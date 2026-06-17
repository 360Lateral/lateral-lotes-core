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

export default
