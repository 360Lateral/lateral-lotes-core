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
import { Plus, Pencil } from "lucide-react";

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

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64" />
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-secondary">Configuración del tablero</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra planes de diagnóstico, tipos de análisis y la matriz que los relaciona.
          </p>
        </div>

        <Tabs defaultValue="planes" className="w-full">
          <TabsList>
            <TabsTrigger value="planes">Planes</TabsTrigger>
            <TabsTrigger value="tipos">Tipos de análisis</TabsTrigger>
            <TabsTrigger value="matriz">Matriz</TabsTrigger>
          </TabsList>

          <TabsContent value="planes" className="mt-6"><PlanesTab /></TabsContent>
          <TabsContent value="tipos" className="mt-6"><TiposTab /></TabsContent>
          <TabsContent value="matriz" className="mt-6"><MatrizTab /></TabsContent>
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
  const openEdit = (p: PlanDiagnostico) => {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-secondary">Planes de diagnóstico</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo plan</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">SMLMV</TableHead>
                <TableHead className="text-right">Precio COP</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">SLA</TableHead>
                <TableHead className="text-right">Orden</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell><code className="text-xs">{p.codigo}</code></TableCell>
                  <TableCell className="text-right">{p.precio_smlmv}</TableCell>
                  <TableCell className="text-right">{p.precio_cop?.toLocaleString("es-CO")}</TableCell>
                  <TableCell>{p.moneda}</TableCell>
                  <TableCell className="text-right">{p.dias_sla}</TableCell>
                  <TableCell className="text-right">{p.orden}</TableCell>
                  <TableCell>{p.activo ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              Guardar
            </Button>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-secondary">Tipos de análisis</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo tipo</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tabla destino</TableHead>
                <TableHead className="text-right">Orden</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell><code className="text-xs">{t.codigo}</code></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.tabla_destino ?? "—"}</TableCell>
                  <TableCell className="text-right">{t.orden}</TableCell>
                  <TableCell>{t.activo ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
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

  // local state: map by `${plan_id}:${tipo_id}` => row
  const [local, setLocal] = useState<Record<string, PlanAnalisisRow>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!planes || !tipos) return;
    const map: Record<string, PlanAnalisisRow> = {};
    for (const p of planes) {
      for (const t of tipos) {
        const key = `${p.id}:${t.id}`;
        const existing = matriz?.find((r) => r.plan_id === p.id && r.tipo_analisis_id === t.id);
        map[key] = existing ?? {
          plan_id: p.id,
          tipo_analisis_id: t.id,
          incluido: false,
          peso_avance: 1.0,
        };
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
    const rows = Object.values(local);
    await upsertMany.mutateAsync(rows);
    setDirty(false);
  };

  const planesOrdenados = useMemo(() => planes ?? [], [planes]);
  const tiposOrdenados = useMemo(() => tipos ?? [], [tipos]);

  if (lp || lt || lm) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-secondary">Matriz plan × análisis</h2>
          {dirty && <p className="text-xs text-primary mt-1">● Cambios sin guardar</p>}
        </div>
        <Button onClick={handleSave} disabled={!dirty || upsertMany.isPending}>
          Guardar cambios
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Tipo de análisis</TableHead>
              {planesOrdenados.map((p) => (
                <TableHead key={p.id} className="text-center min-w-[140px]">{p.nombre}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposOrdenados.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                {planesOrdenados.map((p) => {
                  const key = `${p.id}:${t.id}`;
                  const cell = local[key];
                  if (!cell) return <TableCell key={p.id} />;
                  return (
                    <TableCell key={p.id} className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Checkbox
                          checked={cell.incluido}
                          onCheckedChange={(v) => setCell(p.id, t.id, { incluido: !!v })}
                        />
                        <Select
                          value={String(cell.peso_avance)}
                          onValueChange={(v) => setCell(p.id, t.id, { peso_avance: Number(v) })}
                          disabled={!cell.incluido}
                        >
                          <SelectTrigger className="h-7 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
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
