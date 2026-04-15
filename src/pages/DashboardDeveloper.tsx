import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Plus,
  Trash2,
  X,
  Handshake,
  Search,
  ChevronDown,
  Target,
  MapPin,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// ─── Opciones ──────────────────────────────────────────────────────────────
const usosOptions = ["Cualquiera", "Residencial", "Comercial", "Industrial", "Rural"];
const estratosOptions = [1, 2, 3, 4, 5, 6];
const tratamientosOptions = [
  "Desarrollo",
  "Consolidación",
  "Renovación Urbana",
  "Mejoramiento Integral",
  "Conservación",
  "Redesarrollo",
];

// ─── Score badge ───────────────────────────────────────────────────────────
const ScoreBadge = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-rose-100 text-rose-700 border-rose-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Target className="h-3 w-3" />
      {score}%
    </span>
  );
};

// ─── Formulario de alerta ──────────────────────────────────────────────────
interface AlertaForm {
  nombre: string;
  descripcion: string;
  ciudad: string;
  usoSuelo: string;
  areaMin: string;
  areaMax: string;
  precioMax: string;
  presupuestoMin: string;
  presupuestoMax: string;
  estratos: number[];
  tratamientos: string[];
}

const emptyForm = (): AlertaForm => ({
  nombre: "",
  descripcion: "",
  ciudad: "",
  usoSuelo: "Cualquiera",
  areaMin: "",
  areaMax: "",
  precioMax: "",
  presupuestoMin: "",
  presupuestoMax: "",
  estratos: [],
  tratamientos: [],
});

// ─── Componente de lotes coincidentes ─────────────────────────────────────
const MatchingLotes = ({ alertaId }: { alertaId: string }) => {
  const [open, setOpen] = useState(false);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", alertaId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("criteria_matches")
        .select("score, detalles, lotes(id, nombre_lote, ciudad, barrio, area_total_m2, estado_disponibilidad)")
        .eq("alerta_id", alertaId)
        .order("score", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground">
          <MapPin className="mr-1 h-3 w-3" />
          Ver lotes coincidentes
          <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {isLoading ? (
          <div className="mt-2 space-y-1">
            {[1, 2].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
          </div>
        ) : matches.length === 0 ? (
          <p className="mt-2 text-center font-body text-xs text-muted-foreground py-2">
            Sin coincidencias aún. Los matches se calculan al guardar la alerta.
          </p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {matches.map((m: any) => (
              <Link
                key={m.lotes?.id}
                to={`/lotes/${m.lotes?.id}`}
                className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-body text-xs font-semibold text-foreground truncate">
                    {m.lotes?.nombre_lote}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground truncate">
                    {[m.lotes?.barrio, m.lotes?.ciudad].filter(Boolean).join(", ")}
                    {m.lotes?.area_total_m2 ? ` · ${m.lotes.area_total_m2} m²` : ""}
                  </p>
                </div>
                <ScoreBadge score={m.score} />
              </Link>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────
const DashboardDeveloper = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AlertaForm>(emptyForm());

  const setField = (key: keyof AlertaForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleEstrato = (e: number) =>
    setField("estratos",
      form.estratos.includes(e)
        ? form.estratos.filter((x) => x !== e)
        : [...form.estratos, e]
    );

  const toggleTratamiento = (t: string) =>
    setField("tratamientos",
      form.tratamientos.includes(t)
        ? form.tratamientos.filter((x) => x !== t)
        : [...form.tratamientos, t]
    );

  // Queries resumen
  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ["mis-alertas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: favoritosCount = 0 } = useQuery({
    queryKey: ["dev-favoritos-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("favoritos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: negociacionesCount = 0 } = useQuery({
    queryKey: ["dev-negociaciones-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("negociaciones")
        .select("*", { count: "exact", head: true })
        .eq("developer_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notif", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("notificaciones")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("leida", false);
      return count ?? 0;
    },
  });

  // Obtener score máximo de cada alerta
  const { data: maxScores = {} } = useQuery({
    queryKey: ["max-scores", user?.id],
    enabled: !!user && alertas.length > 0,
    queryFn: async () => {
      const ids = alertas.map((a: any) => a.id);
      const { data, error } = await supabase
        .from("criteria_matches")
        .select("alerta_id, score")
        .in("alerta_id", ids)
        .order("score", { ascending: false });
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((m: any) => {
        if (!(m.alerta_id in map)) map[m.alerta_id] = m.score;
      });
      return map;
    },
  });

  // Crear alerta
  const createAlerta = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("alertas")
        .insert({
          user_id: user!.id,
          nombre: form.nombre || null,
          descripcion: form.descripcion || null,
          ciudad: form.ciudad || null,
          uso_suelo: form.usoSuelo,
          area_min: form.areaMin ? Number(form.areaMin) : null,
          area_max: form.areaMax ? Number(form.areaMax) : null,
          precio_max_m2: form.precioMax ? Number(form.precioMax) : null,
          presupuesto_min: form.presupuestoMin ? Number(form.presupuestoMin) : null,
          presupuesto_max: form.presupuestoMax ? Number(form.presupuestoMax) : null,
          tratamientos: form.tratamientos.length > 0 ? form.tratamientos : null,
          estratos: form.estratos.length > 0 ? form.estratos : null,
          status: "active",
        })
        .select("id")
        .single();
      if (error) throw error;
      // Calcular matches en background
      if (data?.id) {
        await supabase.rpc("refresh_matches_alerta", { p_alerta_id: data.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-alertas"] });
      queryClient.invalidateQueries({ queryKey: ["max-scores"] });
      toast({ title: "Criterio de inversión creado", description: "Los lotes coincidentes han sido calculados." });
      setForm(emptyForm());
      setShowForm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el criterio.", variant: "destructive" });
    },
  });

  // Eliminar alerta
  const deleteAlerta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alertas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-alertas"] });
      queryClient.invalidateQueries({ queryKey: ["max-scores"] });
      toast({ title: "Criterio eliminado" });
    },
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-foreground">Mis Criterios de Inversión</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/lotes">
              <Search className="mr-2 h-4 w-4" />
              Explorar lotes
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="relative">
            <Link to="/dashboard/notificaciones">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
          </Button>
          {!showForm && (
            <Button variant="default" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo criterio
            </Button>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{alertas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Criterios activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{favoritosCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Lotes guardados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{negociacionesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Negociaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de nuevo criterio */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-body text-sm font-semibold text-foreground">Nuevo criterio de inversión</h2>
              <button onClick={() => { setForm(emptyForm()); setShowForm(false); }}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* Identificación */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Nombre del criterio</Label>
                <Input
                  placeholder="Ej: Lotes grandes en Laureles"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Ciudad o municipio</Label>
                <Input
                  placeholder="Ej: Medellín"
                  value={form.ciudad}
                  onChange={(e) => setField("ciudad", e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4 space-y-1.5">
              <Label className="font-body text-xs text-muted-foreground">Descripción (opcional)</Label>
              <Textarea
                placeholder="Describe brevemente el tipo de lote que buscas..."
                className="text-sm resize-none"
                rows={2}
                value={form.descripcion}
                onChange={(e) => setField("descripcion", e.target.value)}
              />
            </div>

            {/* Área y precio */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Área mín. (m²)</Label>
                <Input type="number" min={0} placeholder="0" value={form.areaMin} onChange={(e) => setField("areaMin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Área máx. (m²)</Label>
                <Input type="number" min={0} placeholder="Sin límite" value={form.areaMax} onChange={(e) => setField("areaMax", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Precio máx/m² (COP)</Label>
                <Input type="number" min={0} placeholder="Sin límite" value={form.precioMax} onChange={(e) => setField("precioMax", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Uso de suelo</Label>
                <Select value={form.usoSuelo} onValueChange={(v) => setField("usoSuelo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {usosOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Presupuesto total */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Presupuesto mín. total (COP)</Label>
                <Input type="number" min={0} placeholder="Sin límite" value={form.presupuestoMin} onChange={(e) => setField("presupuestoMin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Presupuesto máx. total (COP)</Label>
                <Input type="number" min={0} placeholder="Sin límite" value={form.presupuestoMax} onChange={(e) => setField("presupuestoMax", e.target.value)} />
              </div>
            </div>

            {/* Estratos */}
            <div className="mb-4">
              <Label className="font-body text-xs text-muted-foreground block mb-2">
                Estratos de interés <span className="text-[10px]">(dejar vacío = cualquiera)</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {estratosOptions.map((e) => (
                  <label key={e} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={form.estratos.includes(e)}
                      onCheckedChange={() => toggleEstrato(e)}
                    />
                    <span className="font-body text-xs text-foreground">Estrato {e}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tratamientos */}
            <div className="mb-5">
              <Label className="font-body text-xs text-muted-foreground block mb-2">
                Tratamientos urbanísticos <span className="text-[10px]">(dejar vacío = cualquiera)</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {tratamientosOptions.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={form.tratamientos.includes(t)}
                      onCheckedChange={() => toggleTratamiento(t)}
                    />
                    <span className="font-body text-xs text-foreground">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              variant="default"
              onClick={() => createAlerta.mutate()}
              disabled={createAlerta.isPending}
            >
              {createAlerta.isPending ? "Calculando matches..." : "Guardar criterio"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de criterios */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Target className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">No tienes criterios de inversión.</p>
          <p className="font-body text-xs text-muted-foreground">
            Crea uno para ver qué lotes coinciden con tu perfil de inversión.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alertas.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                {/* Header de la card */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bell className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="font-body text-sm font-semibold text-foreground truncate">
                        {a.nombre || a.ciudad || "Cualquier ciudad"}
                      </span>
                      {maxScores[a.id] !== undefined && (
                        <ScoreBadge score={maxScores[a.id]} />
                      )}
                    </div>
                    {a.descripcion && (
                      <p className="font-body text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{a.descripcion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAlerta.mutate(a.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    title="Eliminar criterio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Detalles */}
                <div className="space-y-1 font-body text-xs text-muted-foreground">
                  {a.ciudad && <p>Ciudad: {a.ciudad}</p>}
                  <p>Uso suelo: {a.uso_suelo || "Cualquiera"}</p>
                  <p>
                    Área: {a.area_min ? `${a.area_min} m²` : "—"} – {a.area_max ? `${a.area_max} m²` : "Sin límite"}
                  </p>
                  {a.precio_max_m2 && (
                    <p>Precio máx/m²: ${Number(a.precio_max_m2).toLocaleString("es-CO")}</p>
                  )}
                  {a.presupuesto_max && (
                    <p>Presupuesto: {a.presupuesto_min ? `$${Number(a.presupuesto_min).toLocaleString("es-CO")} – ` : "Hasta "}${Number(a.presupuesto_max).toLocaleString("es-CO")}</p>
                  )}
                  {a.estratos?.length > 0 && (
                    <p>Estratos: {a.estratos.join(", ")}</p>
                  )}
                  {a.tratamientos?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.tratamientos.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-2 font-body text-[10px] text-muted-foreground">
                  Creado: {new Date(a.created_at).toLocaleDateString("es-CO")}
                </p>

                {/* Lotes coincidentes */}
                <MatchingLotes alertaId={a.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mis Negociaciones */}
      <MisNegociaciones userId={user?.id} />
    </DashboardLayout>
  );
};

// ─── Sub-componente negociaciones ─────────────────────────────────────────
const estadoNegBadge = (e: string) => {
  switch (e) {
    case "activa": return "disponible" as const;
    case "en_revision": return "reservado" as const;
    case "cerrada": return "vendido" as const;
    case "concretada": return "disponible" as const;
    default: return "default" as const;
  }
};
const estadoNegLabel = (e: string) => {
  switch (e) {
    case "activa": return "Activa";
    case "en_revision": return "En revisión";
    case "cerrada": return "Cerrada";
    case "concretada": return "Concretada";
    default: return e;
  }
};

const MisNegociaciones = ({ userId }: { userId?: string }) => {
  const { data: negociaciones = [], isLoading } = useQuery({
    queryKey: ["dev-negociaciones", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negociaciones")
        .select("*, lotes(nombre_lote, ciudad)")
        .eq("developer_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <h2 className="mb-4 mt-8 font-body text-lg font-bold text-foreground">Mis Negociaciones</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : negociaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <Handshake className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">No tienes negociaciones activas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {negociaciones.map((n: any) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <span className="font-body text-sm font-semibold text-foreground">
                    {(n.lotes as any)?.nombre_lote ?? "Lote"}
                  </span>
                  <Badge variant={estadoNegBadge(n.estado)} className="text-xs">
                    {estadoNegLabel(n.estado)}
                  </Badge>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  {(n.lotes as any)?.ciudad ?? ""} · {new Date(n.created_at).toLocaleDateString("es-CO")}
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/negociacion/${n.id}`}>Ir a sala</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default DashboardDeveloper;
