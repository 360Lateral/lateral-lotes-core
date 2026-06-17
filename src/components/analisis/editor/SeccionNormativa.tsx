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
/* ─── Section 1: Normativa (read-only summary + PDF) ── */
export default function SeccionNormativa({ loteId, lat, lng, pdfProps, defaultOpen, qk: qkProp, onSaved }: SeccionProps & { lat?: number | null; lng?: number | null }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const qk = qkProp ?? ["analisis-normativa", loteId];
  const { data: n } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("normativa_urbana").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (n) setForm(n); }, [n]);
  const upsert = useAnalisisUpsert("normativa_urbana", loteId, qk, onSaved);
  const completed = !!n;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  useAutoMergePdfData("normativo", pdfProps, setForm);

  // POT consultation state
  const [potLoading, setPotLoading] = useState(false);
  const [showPotModal, setShowPotModal] = useState(false);
  const [potData, setPotData] = useState<any>(null);
  const [potSelected, setPotSelected] = useState<Record<string, boolean>>({});

  const consultarPot = async () => {
    if (!lat || !lng) {
      toast({ title: "Coordenadas requeridas", description: "El lote debe tener latitud y longitud.", variant: "destructive" });
      return;
    }
    setPotLoading(true);
    try {
      const { data, error } = await supabase.rpc("consultar_norma_por_punto", { p_lat: lat, p_lng: lng });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({ title: "Sin resultados", description: "No hay datos POT para estas coordenadas.", variant: "destructive" });
        return;
      }
      const pot = data[0];
      setPotData(pot);

      // Check if there's existing data in form
      const hasExisting = POT_FIELDS.some(f => {
        const val = form[f.key];
        return val !== null && val !== undefined && val !== "";
      });

      if (hasExisting) {
        // Show comparison modal
        const initial: Record<string, boolean> = {};
        POT_FIELDS.forEach(f => { initial[f.key] = true; });
        setPotSelected(initial);
        setShowPotModal(true);
      } else {
        // Auto-fill directly
        applyPotData(pot, null);
      }
    } catch (err: any) {
      toast({ title: "Error al consultar POT", description: err.message, variant: "destructive" });
    } finally {
      setPotLoading(false);
    }
  };

  const getPotValue = (pot: any, field: typeof POT_FIELDS[number]) => {
    return pot[field.potKey] != null ? String(pot[field.potKey]) : null;
  };

  const applyPotData = async (pot: any, selected: Record<string, boolean> | null) => {
    let count = 0;
    const updatedFields: Record<string, any> = {};

    POT_FIELDS.forEach(f => {
      if (selected === null || selected[f.key]) {
        const val = getPotValue(pot, f);
        if (val !== null) {
          if (f.key === "cesion_tipo_a_pct" || f.key === "cesion_tipo_b") {
            updatedFields[f.key] = pot[f.potKey];
          } else {
            updatedFields[f.key] = val;
          }
          count++;
        }
      }
    });

    if (pot.poligono_norma) updatedFields.zona_pot = pot.poligono_norma;
    if (pot.zona_homogenea) updatedFields.zona_homogenea = pot.zona_homogenea;
    updatedFields.norma_vigente = "GeoMedellín - Acuerdo 48 de 2014";
    updatedFields.tratamiento = pot.tratamiento || null;

    setShowPotModal(false);

    // CORRECCIÓN: usar updatedFields directamente, no form
    // porque setForm es asíncrono y form aún no se actualizó
    const mergedForm = { ...form, ...updatedFields };
    const ic = mergedForm.indice_construccion;

    const payload = {
      uso_principal: mergedForm.uso_principal || null,
      usos_compatibles: mergedForm.usos_compatibles
        ? (Array.isArray(mergedForm.usos_compatibles)
            ? mergedForm.usos_compatibles
            : mergedForm.usos_compatibles.split(",").map((s: string) => s.trim()).filter(Boolean))
        : null,
      indice_construccion: ic !== undefined && ic !== null && ic !== ""
        ? Number(String(ic).replace(",", "."))
        : null,
      indice_ocupacion: mergedForm.indice_ocupacion ?? null,
      io_plataforma: mergedForm.io_plataforma ?? null,
      io_torre: mergedForm.io_torre ?? null,
      altura_max_pisos: mergedForm.altura_max_pisos ?? null,
      altura_max_metros: mergedForm.altura_max_metros ?? null,
      aislamiento_frontal_m: mergedForm.aislamiento_frontal_m ?? null,
      aislamiento_posterior_m: mergedForm.aislamiento_posterior_m ?? null,
      aislamiento_lateral_m: mergedForm.aislamiento_lateral_m ?? null,
      zona_pot: mergedForm.zona_pot || null,
      zona_homogenea: mergedForm.zona_homogenea || null,
      tratamiento: updatedFields.tratamiento || mergedForm.tratamiento || null,
      norma_vigente: mergedForm.norma_vigente || null,
      cesion_tipo_a_pct: mergedForm.cesion_tipo_a_pct ?? null,
      cesion_tipo_b: mergedForm.cesion_tipo_b ?? null,
      densidad_max: mergedForm.densidad_max ? parseInt(String(mergedForm.densidad_max).replace(',', '.')) : null,
      altura_texto: mergedForm.altura_texto || null,
    };

    try {
      const { data: existing } = await supabase
        .from("normativa_urbana")
        .select("id")
        .eq("lote_id", loteId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("normativa_urbana")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("normativa_urbana")
          .insert({ ...payload, lote_id: loteId });
        if (error) throw error;
      }

      setForm((prev: any) => ({ ...prev, ...updatedFields }));
      toast({
        title: `Norma POT aplicada — ${count} campos actualizados desde GeoMedellín · Acuerdo 48 de 2014`
      });
    } catch (err: any) {
      toast({
        title: "Error al guardar — intenta de nuevo",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full"><SectionHeader icon={FileText} label="Normativo" completed={completed} open={open} areaKey="normativo" pdfProps={pdfProps} /></button>
        </CollapsibleTrigger>
        <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
          {/* POT Button */}
          {lat && lng && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 text-xs text-foreground">Consulta automática desde GeoMedellín · POT Acuerdo 48/2014</span>
              <Button type="button" size="sm" disabled={potLoading} onClick={consultarPot}>
                {potLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Consultando…</> : "Consultar norma POT"}
              </Button>
            </div>
          )}

          {/* MapGIS — consulta automática de datos urbanísticos */}
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <MapGISConsulta
              loteId={loteId}
              onApply={(datos) => {
                if (datos.uso_principal)        set("uso_principal", datos.uso_principal);
                if (datos.tratamiento)           set("tratamiento", datos.tratamiento);
                if (datos.indice_construccion != null) set("indice_construccion", String(datos.indice_construccion));
                if (datos.altura_normativa)      set("altura_texto", datos.altura_normativa);
              }}
            />
          </div>

          <PdfExtractPanel pdfProps={pdfProps} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <Field label="Uso principal">
                <Input value={form.uso_principal ?? ""} onChange={(e) => set("uso_principal", e.target.value)} />
              </Field>
              <Sugerencia areaKey="normativo" campo="uso_principal" pdfProps={pdfProps} onApply={(v) => set("uso_principal", v)} />
            </div>
            <div>
              <Field label="Índice construcción" tooltip={"Multiplicador sobre el área del lote que determina los m² construibles totales.\nEj: IC 1,4 en lote de 200m² = 280m² máx"}>
                <Input value={form.indice_construccion ?? ""} onChange={(e) => set("indice_construccion", e.target.value || null)} />
              </Field>
              <Sugerencia areaKey="normativo" campo="indice_construccion" pdfProps={pdfProps} onApply={(v) => set("indice_construccion", v)} />
            </div>
            <div>
              <Field label="IO plataforma" tooltip={"Índice de Ocupación máximo para el primer nivel o plataforma de la edificación. Define qué porcentaje del lote puede ser cubierto en planta baja.\nEj: 0.80 = máximo 80% del área del lote ocupada en primer piso"}>
                <Input type="number" step="0.01" value={form.io_plataforma ?? ""} onChange={(e) => set("io_plataforma", e.target.value ? Number(e.target.value) : null)} />
              </Field>
            </div>
            <div>
              <Field label="IO torre" tooltip={"Índice de Ocupación máximo para los pisos superiores o torre de la edificación. Generalmente menor que el IO de plataforma para garantizar retiros en altura.\nEj: 0.60 = máximo 60% del área del lote ocupada en pisos superiores"}>
                <Input type="number" step="0.01" value={form.io_torre ?? ""} onChange={(e) => set("io_torre", e.target.value ? Number(e.target.value) : null)} />
              </Field>
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
              <Field label="Densidad máxima" tooltip={"Número máximo de viviendas permitidas por hectárea de suelo urbanizable.\nUnidad: viv/ha"}>
                <Input value={form.densidad_max ?? ""} onChange={(e) => set("densidad_max", e.target.value || null)} />
              </Field>
            </div>
            <div>
              <Field label="Altura normativa" tooltip={"Altura máxima de la edificación en pisos o metros. N/A = regulada por IC, sin tope de pisos"}>
                <Input value={form.altura_texto ?? ""} onChange={(e) => set("altura_texto", e.target.value || null)} />
              </Field>
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
              <Field label="Polígono de norma" tooltip={"Código único del polígono normativo según el mapa protocolizado del POT Acuerdo 48 de 2014"}>
                <Input value={form.zona_pot ?? ""} onChange={(e) => set("zona_pot", e.target.value)} />
              </Field>
              <Sugerencia areaKey="normativo" campo="zona_pot" pdfProps={pdfProps} onApply={(v) => set("zona_pot", v)} />
            </div>
            <div>
              <Field label="Zona homogénea" tooltip={"División territorial con características urbanas similares. Ej: Z4 = Zona 4"}>
                <Input value={form.zona_homogenea ?? ""} onChange={(e) => set("zona_homogenea", e.target.value)} />
              </Field>
            </div>
            <div>
              <Field label="Tratamiento" tooltip={"Directriz que define qué intervención se permite. Tipos: Consolidación / Renovación / Desarrollo / Mejoramiento / Conservación"}>
                <Input value={form.tratamiento ?? ""} onChange={(e) => set("tratamiento", e.target.value)} />
              </Field>
              <Sugerencia areaKey="normativo" campo="tratamiento" pdfProps={pdfProps} onApply={(v) => set("tratamiento", v)} />
            </div>
            <div>
              <Field label="Fuente norma" tooltip={"Acuerdo municipal o decreto que establece la norma urbanística vigente para el predio"}>
                <Input value={form.norma_vigente ?? ""} onChange={(e) => set("norma_vigente", e.target.value)} />
              </Field>
              <Sugerencia areaKey="normativo" campo="norma_vigente" pdfProps={pdfProps} onApply={(v) => set("norma_vigente", v)} />
            </div>
            <div>
              <Field label="Cesión tipo A (%)" tooltip={"Suelo a ceder gratuitamente al municipio para parques y espacio público.\nUnidad: m² por habitante"}>
                <Input type="number" step="0.1" value={form.cesion_tipo_a_pct ?? ""} onChange={(e) => set("cesion_tipo_a_pct", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Sugerencia areaKey="normativo" campo="cesion_tipo_a_pct" pdfProps={pdfProps} onApply={(v) => set("cesion_tipo_a_pct", v)} />
            </div>
            <div>
              <Field label="Cesión tipo B (%)" tooltip={"Área para equipamientos colectivos como colegios y centros de salud.\nUnidad: m² por cada 100m² construidos"}>
                <Input type="number" step="0.1" value={form.cesion_tipo_b ?? ""} onChange={(e) => set("cesion_tipo_b", e.target.value ? Number(e.target.value) : null)} />
              </Field>
            </div>
          </div>
          <Field label="Observaciones">
            <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
          </Field>
          <Sugerencia areaKey="normativo" campo="observaciones" pdfProps={pdfProps} onApply={(v) => set("observaciones", v)} />
          <Button onClick={() => upsert.mutate({
            uso_principal: form.uso_principal || null,
            usos_compatibles: form.usos_compatibles ? (Array.isArray(form.usos_compatibles) ? form.usos_compatibles : form.usos_compatibles.split(",").map((s: string) => s.trim()).filter(Boolean)) : null,
            indice_construccion: form.indice_construccion ? Number(String(form.indice_construccion).replace(",", ".")) : null,
            indice_ocupacion: form.indice_ocupacion,
            io_plataforma: form.io_plataforma ?? null,
            io_torre: form.io_torre ?? null,
            altura_max_pisos: form.altura_max_pisos, altura_max_metros: form.altura_max_metros,
            aislamiento_frontal_m: form.aislamiento_frontal_m, aislamiento_posterior_m: form.aislamiento_posterior_m,
            aislamiento_lateral_m: form.aislamiento_lateral_m, zona_pot: form.zona_pot || null,
            zona_homogenea: form.zona_homogenea || null,
            tratamiento: form.tratamiento || null, norma_vigente: form.norma_vigente || null,
            cesion_tipo_a_pct: form.cesion_tipo_a_pct,
            cesion_tipo_b: form.cesion_tipo_b ?? null,
            densidad_max: form.densidad_max ? parseInt(String(form.densidad_max).replace(',', '.')) : null,
            altura_texto: form.altura_texto || null,
          })} disabled={upsert.isPending}>
            {upsert.isPending ? "Guardando…" : "Guardar Normativo"}
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* POT Comparison Modal */}
      <Dialog open={showPotModal} onOpenChange={setShowPotModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Datos encontrados en el POT</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Selecciona los campos que deseas reemplazar con los valores del POT.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-xs">Campo</TableHead>
                <TableHead className="text-xs">Valor actual</TableHead>
                <TableHead className="text-xs">Valor POT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {potData && POT_FIELDS.map(f => {
                const potVal = getPotValue(potData, f);
                const currentVal = form[f.key] != null && form[f.key] !== "" ? String(form[f.key]) : "—";
                return (
                  <TableRow key={f.key}>
                    <TableCell className="p-2">
                      <Checkbox
                        checked={potSelected[f.key] ?? true}
                        onCheckedChange={(v) => setPotSelected(prev => ({ ...prev, [f.key]: v === true }))}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-xs font-medium">{f.label}</TableCell>
                    <TableCell className="p-2 text-xs text-muted-foreground">{currentVal}</TableCell>
                    <TableCell className="p-2 text-xs font-medium text-primary">{potVal ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPotModal(false)}>Cancelar</Button>
            <Button onClick={() => potData && applyPotData(potData, potSelected)}>Aplicar seleccionados</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
