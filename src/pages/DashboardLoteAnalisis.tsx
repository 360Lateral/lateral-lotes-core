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
import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronDown, ChevronRight,
  Scale, Leaf, Zap, Mountain, TrendingUp, Building2, DollarSign, FileText,
} from "lucide-react";

/* ─── helpers ──────────────────────────────────── */

const SectionHeader = ({ icon: Icon, label, completed, open }: { icon: any; label: string; completed: boolean; open: boolean }) => (
  <div className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-body text-sm font-semibold text-foreground">{label}</span>
      <Badge variant={completed ? "disponible" : "secondary"} className="text-[10px]">
        {completed ? "Completado" : "Pendiente"}
      </Badge>
    </div>
    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
  </div>
);

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

  const { data: lote, isLoading: loadingLote } = useQuery({
    queryKey: ["analisis-lote", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lotes").select("nombre_lote").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (loadingLote) {
    return <DashboardLayout><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-96" /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <Link to="/dashboard/lotes" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Volver a lotes
      </Link>
      <h1 className="mb-6 font-body text-xl font-bold text-foreground">
        Análisis 360° — {lote?.nombre_lote ?? "Lote"}
      </h1>

      <div className="flex flex-col gap-3">
        <NormativaSection loteId={id!} />
        <JuridicoSection loteId={id!} />
        <AmbientalSection loteId={id!} />
        <SSPPSection loteId={id!} />
        <SuelosSection loteId={id!} />
        <MercadoSection loteId={id!} />
        <ArquitectonicoSection loteId={id!} />
        <FinancieroSection loteId={id!} />
      </div>
    </DashboardLayout>
  );
};

/* ─── Section 1: Normativa (read-only summary) ── */
const NormativaSection = ({ loteId }: { loteId: string }) => {
  const [open, setOpen] = useState(false);
  const { data: n } = useQuery({
    queryKey: ["analisis-normativa", loteId],
    queryFn: async () => {
      const { data } = await supabase.from("normativa_urbana").select("*").eq("lote_id", loteId).maybeSingle();
      return data;
    },
  });
  const completed = !!n;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={FileText} label="Normativo" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4">
        {n ? (
          <div className="grid grid-cols-2 gap-3 font-body text-sm md:grid-cols-3">
            <div><span className="text-muted-foreground">Uso principal:</span> <span className="text-foreground">{n.uso_principal ?? "—"}</span></div>
            <div><span className="text-muted-foreground">IC:</span> <span className="text-foreground">{n.indice_construccion ?? "—"}</span></div>
            <div><span className="text-muted-foreground">IO:</span> <span className="text-foreground">{n.indice_ocupacion ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Pisos máx:</span> <span className="text-foreground">{n.altura_max_pisos ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Zona POT:</span> <span className="text-foreground">{n.zona_pot ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Tratamiento:</span> <span className="text-foreground">{n.tratamiento ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Cesión A:</span> <span className="text-foreground">{n.cesion_tipo_a_pct != null ? `${n.cesion_tipo_a_pct}%` : "—"}</span></div>
            <div><span className="text-muted-foreground">Norma:</span> <span className="text-foreground">{n.norma_vigente ?? "—"}</span></div>
          </div>
        ) : (
          <p className="text-center font-body text-sm text-muted-foreground py-4">Sin datos normativos. Edítalos desde la ficha del lote.</p>
        )}
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
      if (existing) {
        const { error } = await supabase.from(table as any).update({ ...values, updated_at: new Date().toISOString() }).eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert({ ...values, lote_id: loteId });
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
const JuridicoSection = ({ loteId }: { loteId: string }) => {
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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Scale} label="Jurídico" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
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
        <div className="grid grid-cols-2 gap-3">
          <CheckField label="Gravámenes" checked={!!form.gravamenes} onChange={(v) => set("gravamenes", v)} />
          <CheckField label="Hipoteca activa" checked={!!form.hipoteca_activa} onChange={(v) => set("hipoteca_activa", v)} />
          <CheckField label="Servidumbres" checked={!!form.servidumbres} onChange={(v) => set("servidumbres", v)} />
          <CheckField label="Deuda predial" checked={!!form.deuda_predial} onChange={(v) => set("deuda_predial", v)} />
          <CheckField label="Discrepancia de áreas" checked={!!form.discrepancia_areas} onChange={(v) => set("discrepancia_areas", v)} />
          <CheckField label="Proceso sucesión" checked={!!form.proceso_sucesion} onChange={(v) => set("proceso_sucesion", v)} />
          <CheckField label="Litigio activo" checked={!!form.litigio_activo} onChange={(v) => set("litigio_activo", v)} />
        </div>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
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
const AmbientalSection = ({ loteId }: { loteId: string }) => {
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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Leaf} label="Ambiental" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CheckField label="Ronda hídrica" checked={!!form.ronda_hidrica} onChange={(v) => set("ronda_hidrica", v)} />
          <CheckField label="Reserva forestal" checked={!!form.reserva_forestal} onChange={(v) => set("reserva_forestal", v)} />
          <CheckField label="Pasivo ambiental" checked={!!form.pasivo_ambiental} onChange={(v) => set("pasivo_ambiental", v)} />
          <CheckField label="Requiere licencia ambiental" checked={!!form.requiere_licencia_ambiental} onChange={(v) => set("requiere_licencia_ambiental", v)} />
        </div>
        {form.ronda_hidrica && (
          <Field label="Distancia ronda (m)">
            <Input type="number" value={form.distancia_ronda_m ?? ""} onChange={(e) => set("distancia_ronda_m", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
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
const SSPPSection = ({ loteId }: { loteId: string }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-sspp", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_sspp" as any).select("*").eq("lote_id", loteId).maybeSingle();
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_sspp", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Zap} label="SSPP" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CheckField label="Acueducto" checked={!!form.acueducto_disponible} onChange={(v) => set("acueducto_disponible", v)} />
          <CheckField label="Alcantarillado" checked={!!form.alcantarillado_disponible} onChange={(v) => set("alcantarillado_disponible", v)} />
          <CheckField label="Energía" checked={!!form.energia_disponible} onChange={(v) => set("energia_disponible", v)} />
          <CheckField label="Gas" checked={!!form.gas_disponible} onChange={(v) => set("gas_disponible", v)} />
          <CheckField label="Vía pavimentada" checked={!!form.via_pavimentada} onChange={(v) => set("via_pavimentada", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Capacidad red (kVA)">
            <Input type="number" value={form.capacidad_red_kva ?? ""} onChange={(e) => set("capacidad_red_kva", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Distancia red matriz (m)">
            <Input type="number" value={form.distancia_red_matriz_m ?? ""} onChange={(e) => set("distancia_red_matriz_m", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Costo extensión estimado (COP)">
            <Input type="number" value={form.costo_extension_estimado ?? ""} onChange={(e) => set("costo_extension_estimado", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
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
const SuelosSection = ({ loteId }: { loteId: string }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-geotecnico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_geotecnico" as any).select("*").eq("lote_id", loteId).maybeSingle();
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_geotecnico", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Mountain} label="Suelos" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Capacidad portante (ton/m²)">
            <Input type="number" value={form.capacidad_portante_ton_m2 ?? ""} onChange={(e) => set("capacidad_portante_ton_m2", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Nivel freático (m)">
            <Input type="number" value={form.nivel_freatico_m ?? ""} onChange={(e) => set("nivel_freatico_m", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Pendiente (%)">
            <Input type="number" value={form.pendiente_pct ?? ""} onChange={(e) => set("pendiente_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <Field label="Sobrecosto cimentación estimado (COP)">
          <Input type="number" value={form.sobrecosto_cimentacion_estimado ?? ""} onChange={(e) => set("sobrecosto_cimentacion_estimado", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
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
const MercadoSection = ({ loteId }: { loteId: string }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-mercado", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_mercado" as any).select("*").eq("lote_id", loteId).maybeSingle();
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_mercado", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={TrendingUp} label="Mercado" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio venta m² zona (COP)">
            <Input type="number" value={form.precio_venta_m2_zona ?? ""} onChange={(e) => set("precio_venta_m2_zona", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Precio unidad promedio (COP)">
            <Input type="number" value={form.precio_unidad_promedio ?? ""} onChange={(e) => set("precio_unidad_promedio", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Proyectos competidores">
            <Input type="number" value={form.proyectos_competidores ?? ""} onChange={(e) => set("proyectos_competidores", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Velocidad absorción (und/mes)">
            <Input type="number" value={form.velocidad_absorcion_unidades_mes ?? ""} onChange={(e) => set("velocidad_absorcion_unidades_mes", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
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
        <Field label="Valorización anual (%)">
          <Input type="number" value={form.valorizacion_anual_pct ?? ""} onChange={(e) => set("valorizacion_anual_pct", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
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
const ArquitectonicoSection = ({ loteId }: { loteId: string }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-arquitectonico", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_arquitectonico" as any).select("*").eq("lote_id", loteId).maybeSingle();
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_arquitectonico", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={Building2} label="Arquitectónico" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="m² construibles total">
            <Input type="number" value={form.m2_construibles_total ?? ""} onChange={(e) => set("m2_construibles_total", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Unidades estimadas">
            <Input type="number" value={form.unidades_estimadas ?? ""} onChange={(e) => set("unidades_estimadas", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Área vendible (%)">
            <Input type="number" value={form.area_vendible_pct ?? ""} onChange={(e) => set("area_vendible_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Eficiencia lote (%)">
            <Input type="number" value={form.eficiencia_lote_pct ?? ""} onChange={(e) => set("eficiencia_lote_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <Field label="Tipologías posibles">
          <Input value={form.tipologias ?? ""} onChange={(e) => set("tipologias", e.target.value)} />
        </Field>
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
        <CheckField label="Permite sótano" checked={!!form.permite_sotano} onChange={(v) => set("permite_sotano", v)} />
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
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
const FinancieroSection = ({ loteId }: { loteId: string }) => {
  const [open, setOpen] = useState(false);
  const qk = ["analisis-financiero", loteId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data } = await supabase.from("analisis_financiero" as any).select("*").eq("lote_id", loteId).maybeSingle();
      return data as any;
    },
  });
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const upsert = useAnalisisUpsert("analisis_financiero", loteId, qk);
  const completed = !!data;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full"><SectionHeader icon={DollarSign} label="Financiero" completed={completed} open={open} /></button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-b-lg border border-t-0 border-border bg-background p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor compra lote (COP)">
            <Input type="number" value={form.valor_compra_lote ?? ""} onChange={(e) => set("valor_compra_lote", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Costo construcción/m² (COP)">
            <Input type="number" value={form.costo_construccion_m2 ?? ""} onChange={(e) => set("costo_construccion_m2", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Ingresos proyectados (COP)">
            <Input type="number" value={form.ingresos_proyectados ?? ""} onChange={(e) => set("ingresos_proyectados", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Margen bruto (%)">
            <Input type="number" value={form.margen_bruto_pct ?? ""} onChange={(e) => set("margen_bruto_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="TIR (%)">
            <Input type="number" value={form.tir_pct ?? ""} onChange={(e) => set("tir_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="VPN (COP)">
            <Input type="number" value={form.vpn ?? ""} onChange={(e) => set("vpn", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Punto equilibrio (%)">
            <Input type="number" value={form.punto_equilibrio_pct ?? ""} onChange={(e) => set("punto_equilibrio_pct", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
        <Field label="Observaciones">
          <Textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} />
        </Field>
        <Button onClick={() => upsert.mutate({
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
