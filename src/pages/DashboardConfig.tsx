import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanesDiagnostico, usePlanesAnalisis, PlanDiagnostico, PlanAnalisisRow } from "@/hooks/usePlanesConfig";
import { useTiposAnalisis, TipoAnalisis } from "@/hooks/useTiposAnalisis";
import { toast } from "sonner";
import { Plus, Pencil, Package, Layers, Grid3x3, AlertCircle, Settings } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOP } from "@/lib/format";

const planSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  precio_smlmv: z.coerce.number().min(0),
  precio_cop: z.coerce.number().int().gt(0, "Precio debe ser mayor que 0"),
  moneda: z.enum(["COP", "USD"]),
  dias_sla: z.coerce.number().int().gt(0, "Días SLA debe ser mayor que 0"),
  orden: z.coerce.number().int().min(0),
  activo: z.boolean(),
});

const PESOS = [0.5, 1.0, 1.5, 2.0];

const DashboardConfig = () => {
  const { roles, loading } = useAuth();
  const isSuperAdmin = roles.includes("super_admin" as any);

  const { data: planes } = usePlanesDiagnostico();
  const { data: tipos } = useTiposAnalisis();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl p-6"><Skeleton className="h-40 w-full" /></div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-heading text-xl font-bold text-foreground">Sin permisos</h1>
          <p className="mt-2 text-sm text-muted-foreground">No tienes permisos para ver esta página.</p>
          <Button asChild className="mt-6"><Link to="/dashboard">Volver al dashboard</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const planesActivos = (planes ?? []).filter((p) => p.activo);
  const tiposActivos = (tipos ?? []).filter((t) => t.activo);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Settings className="h-5 w-5" /> Configuración
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <strong className="text-foreground">
                {planesActivos.length} {planesActivos.length === 1 ? "plan activo" : "planes activos"}
              </strong>
              {" · "}
              <strong className="text-foreground">
                {tiposActivos.length} tipos de análisis
              </strong>
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
            <AlertCircle className="h-3 w-3" />
            Cambios afectan a futuros usuarios y contratos
          </div>
        </header>

        <Tabs defaultValue="planes" className="w-full">
          <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
            {[
              { v: "planes", l: "Planes", i: Package },
              { v: "tipos", l: "Tipos de análisis", i: Layers },
              { v: "matriz", l: "Matriz", i: Grid3x3 },
            ].map(({ v, l, i: I }) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <I className="mr-1.5 h-3.5 w-3.5" /> {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="planes" className="mt-4"><PlanesTab /></TabsContent>
          <TabsContent value="tipos" className="mt-4"><TiposTab /></TabsContent>
          <TabsContent value="matriz" className="mt-4"><MatrizTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

/* ---------- PLANES TAB ---------- */
const emptyPlan = {
  codigo: "", nombre: "", precio_smlmv: 0, precio_cop: 0,
  moneda: "COP", dias_sla: 14, orden: 0, activo: true,
};

const PlanesTab = () => {
  const { data: planes, isLoading, create, update } = usePlanesDiagnostico();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanDiagnostico | null>(null);
  const [form, setForm] = useState<any>(emptyPlan);

  const openCreate = () => { setEditing(null); setForm(emptyPlan); setOpen(true); };
  const openEdit = (p: PlanDiagnostico) => { setEditing(p); setForm({ ...p }); setOpen(true); };

  const handleSave = async () => {
    const parsed = planSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...parsed.data });
    } else {
      if (!form.codigo) { toast.error("Código requerido"); return; }
      await create.mutateAsync({ ...parsed.data, codigo: form.codigo } as any);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Planes de diagnóstico</h2>
          <p className="text-[11px] text-muted-foreground">Catálogo de planes que el propietario puede contratar.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo plan
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !planes || planes.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aún no tienes planes de diagnóstico"
          description="Crea el primer plan para que los propietarios puedan contratar diagnósticos."
          action={<Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-3.5 w-3.5" /> Crear plan</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[10px] uppercase tracking-wide">Plan</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wide">Precio</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wide">Días SLA</TableHead>
                <TableHead className="text-center text-[10px] uppercase tracking-wide">Activo</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.map((p) => (
                <TableRow key={p.id} className={!p.activo ? "opacity-60" : "hover:bg-muted/30"}>
                  <TableCell>
                    <div className="text-xs font-semibold text-foreground">{p.nombre}</div>
                    <div className="text-[10px] text-muted-foreground">
                      <code>{p.codigo}</code> · orden {p.orden}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-xs font-semibold text-foreground">{formatCOP(p.precio_cop ?? 0)}</div>
                    <div className="text-[10px] text-muted-foreground">{p.precio_smlmv} SMLMV</div>
                  </TableCell>
                  <TableCell className="text-right text-xs">{p.dias_sla} días</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={p.activo}
                      onCheckedChange={(v) =>
                        update.mutateAsync({ id: p.id, activo: v } as any)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plan" : "Nuevo plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {!editing && (
              <div className="col-span-2">
                <Label>Código</Label>
                <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="ej. premium" />
              </div>
            )}
            <div className="col-span-2">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Precio SMLMV</Label>
              <Input type="number" step="0.01" value={form.precio_smlmv} onChange={(e) => setForm({ ...form, precio_smlmv: e.target.value })} />
            </div>
            <div>
              <Label>Precio COP</Label>
              <Input type="number" value={form.precio_cop} onChange={(e) => setForm({ ...form, precio_cop: e.target.value })} />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Días SLA</Label>
              <Input type="number" value={form.dias_sla} onChange={(e) => setForm({ ...form, dias_sla: e.target.value })} />
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} />
              <Label>Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------- TIPOS TAB ---------- */
const emptyTipo = { codigo: "", nombre: "", tabla_destino: "", orden: 0, activo: true };

const TiposTab = () => {
  const { data: tipos, isLoading, create, update } = useTiposAnalisis();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoAnalisis | null>(null);
  const [form, setForm] = useState<any>(emptyTipo);

  const openCreate = () => { setEditing(null); setForm(emptyTipo); setOpen(true); };
  const openEdit = (t: TipoAnalisis) => { setEditing(t); setForm({ ...t, tabla_destino: t.tabla_destino ?? "" }); setOpen(true); };

  const handleSave = async () => {
    if (!form.nombre) { toast.error("Nombre requerido"); return; }
    const payload = {
      nombre: form.nombre,
      tabla_destino: form.tabla_destino || null,
      orden: Number(form.orden) || 0,
      activo: !!form.activo,
    };
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...payload });
    } else {
      if (!form.codigo) { toast.error("Código requerido"); return; }
      await create.mutateAsync({ ...payload, codigo: form.codigo });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tipos de análisis</h2>
          <p className="text-[11px] text-muted-foreground">Categorías de análisis disponibles para los expertos.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Nuevo tipo
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !tipos || tipos.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No hay tipos de análisis"
          description="Crea el primer tipo para habilitar análisis especializados."
          action={<Button size="sm" onClick={openCreate}><Plus className="mr-1.5 h-3.5 w-3.5" /> Crear tipo</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[10px] uppercase tracking-wide">Tipo</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wide">Tabla destino</TableHead>
                <TableHead className="text-right text-[10px] uppercase tracking-wide">Orden</TableHead>
                <TableHead className="text-center text-[10px] uppercase tracking-wide">Activo</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((t) => (
                <TableRow key={t.id} className={!t.activo ? "opacity-60" : "hover:bg-muted/30"}>
                  <TableCell>
                    <div className="text-xs font-semibold text-foreground">{t.nombre}</div>
                    <div className="text-[10px] text-muted-foreground"><code>{t.codigo}</code></div>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    <code>{t.tabla_destino ?? "—"}</code>
                  </TableCell>
                  <TableCell className="text-right text-xs">{t.orden}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={t.activo}
                      onCheckedChange={(v) => update.mutateAsync({ id: t.id, activo: v } as any)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tipo" : "Nuevo tipo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código {editing && <span className="text-xs text-muted-foreground">(no editable)</span>}</Label>
              <Input value={form.codigo} disabled={!!editing} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Tabla destino</Label>
              <Input value={form.tabla_destino} onChange={(e) => setForm({ ...form, tabla_destino: e.target.value })} placeholder="ej. analisis_juridico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} />
                <Label>Activo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------- MATRIZ TAB ---------- */
const MatrizTab = () => {
  const { data: planes, isLoading: lp } = usePlanesDiagnostico();
  const { data: tipos, isLoading: lt } = useTiposAnalisis();
  const { data: matriz, isLoading: lm, upsertMany } = usePlanesAnalisis();

  const [local, setLocal] = useState<Record<string, PlanAnalisisRow>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!planes || !tipos) return;
    const map: Record<string, PlanAnalisisRow> = {};
    for (const p of planes) {
      for (const t of tipos) {
        const key = `${p.id}:${t.id}`;
        const existing = matriz?.find((r) => r.plan_id === p.id && r.tipo_analisis_id === t.id);
        map[key] = existing ?? { plan_id: p.id, tipo_analisis_id: t.id, incluido: false, peso_avance: 1.0 };
      }
    }
    setLocal(map);
    setDirty(false);
  }, [planes, tipos, matriz]);

  const setCell = (planId: string, tipoId: string, patch: Partial<PlanAnalisisRow>) => {
    const key = `${planId}:${tipoId}`;
    setLocal((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setDirty(true);
  };

  const handleSave = async () => {
    await upsertMany.mutateAsync(Object.values(local));
    setDirty(false);
  };

  const planesOrdenados = useMemo(() => planes ?? [], [planes]);
  const tiposOrdenados = useMemo(() => tipos ?? [], [tipos]);

  if (lp || lt || lm) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Matriz plan × análisis</h2>
          <p className="text-[11px] text-muted-foreground">
            Define qué análisis incluye cada plan y su peso de avance.
            {dirty && <span className="ml-2 text-primary font-medium">● Cambios sin guardar</span>}
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || upsertMany.isPending}>
          Guardar cambios
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="min-w-[200px] text-[10px] uppercase tracking-wide">Tipo de análisis</TableHead>
              {planesOrdenados.map((p) => (
                <TableHead key={p.id} className="text-center min-w-[120px] text-[10px] uppercase tracking-wide">
                  {p.nombre}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposOrdenados.map((t) => (
              <TableRow key={t.id} className="hover:bg-muted/30">
                <TableCell className="text-xs font-medium">{t.nombre}</TableCell>
                {planesOrdenados.map((p) => {
                  const key = `${p.id}:${t.id}`;
                  const cell = local[key];
                  if (!cell) return <TableCell key={p.id} />;
                  return (
                    <TableCell key={p.id} className="text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <Checkbox
                          checked={cell.incluido}
                          onCheckedChange={(v) => setCell(p.id, t.id, { incluido: !!v })}
                        />
                        <Select
                          value={String(cell.peso_avance)}
                          onValueChange={(v) => setCell(p.id, t.id, { peso_avance: Number(v) })}
                          disabled={!cell.incluido}
                        >
                          <SelectTrigger className="h-6 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PESOS.map((w) => (
                              <SelectItem key={w} value={String(w)}>{w.toFixed(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DashboardConfig;
