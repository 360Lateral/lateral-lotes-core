import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, FileText, Filter } from "lucide-react";
import {
  useDocumentosRequeridos,
  useCrearDocumentoRequerido,
  useActualizarDocumentoRequerido,
  useEliminarDocumentoRequerido,
  type DocRequeridoAdmin,
  type DocRequeridoInput,
} from "@/hooks/admin/useDocumentosRequeridos";
import { usePlanesDiagnostico } from "@/hooks/usePlanesConfig";
import { useTiposAnalisis } from "@/hooks/useTiposAnalisis";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  modo: "crear" | "editar";
  documento?: DocRequeridoAdmin | null;
  planes: { id: string; nombre: string; codigo: string }[];
  tipos: { id: string; nombre: string }[];
}

const emptyForm = (planes: FormDialogProps["planes"], tipos: FormDialogProps["tipos"]): DocRequeridoInput => ({
  plan_id: planes[0]?.id ?? "",
  tipo_analisis_id: tipos[0]?.id ?? "",
  nombre: "",
  descripcion: "",
  opcional: false,
  orden: 0,
  activo: true,
});

const DocumentoRequeridoFormDialog = ({
  open,
  onOpenChange,
  modo,
  documento,
  planes,
  tipos,
}: FormDialogProps) => {
  const [form, setForm] = useState<DocRequeridoInput>(
    documento
      ? {
          plan_id: documento.plan_id,
          tipo_analisis_id: documento.tipo_analisis_id,
          nombre: documento.nombre,
          descripcion: documento.descripcion ?? "",
          opcional: documento.opcional,
          orden: documento.orden,
          activo: documento.activo,
        }
      : emptyForm(planes, tipos),
  );

  const crear = useCrearDocumentoRequerido();
  const actualizar = useActualizarDocumentoRequerido();
  const busy = crear.isPending || actualizar.isPending;

  const submit = async () => {
    if (!form.nombre.trim() || !form.plan_id || !form.tipo_analisis_id) {
      return;
    }
    const payload = { ...form, descripcion: form.descripcion?.trim() || null };
    if (modo === "crear") {
      await crear.mutateAsync(payload);
    } else if (documento) {
      await actualizar.mutateAsync({ id: documento.id, ...payload });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {modo === "crear" ? "Agregar documento requerido" : "Editar documento"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan</Label>
              <Select
                value={form.plan_id}
                onValueChange={(v) => setForm({ ...form, plan_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  {planes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Análisis</Label>
              <Select
                value={form.tipo_analisis_id}
                onValueChange={(v) => setForm({ ...form, tipo_analisis_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Análisis" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nombre del documento *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Escritura del lote"
            />
          </div>

          <div>
            <Label>Descripción para el cliente</Label>
            <Textarea
              value={form.descripcion ?? ""}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Vigencia máxima 30 días. Descargable en VUR…"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.orden}
                onChange={(e) =>
                  setForm({ ...form, orden: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Es opcional</Label>
              <div className="flex h-10 items-center gap-2">
                <Switch
                  checked={form.opcional}
                  onCheckedChange={(v) => setForm({ ...form, opcional: v })}
                />
                <span className="text-xs text-muted-foreground">
                  No bloquea el flujo
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.activo}
              onCheckedChange={(v) => setForm({ ...form, activo: v })}
            />
            <Label className="m-0">Activo (visible para el cliente)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy || !form.nombre.trim()}>
            {modo === "crear" ? "Crear" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DocumentosRequeridosManager = () => {
  const [filtroPlan, setFiltroPlan] = useState<string>("all");
  const [crearOpen, setCrearOpen] = useState(false);
  const [editando, setEditando] = useState<DocRequeridoAdmin | null>(null);

  const { data: docs, isLoading } = useDocumentosRequeridos(
    filtroPlan === "all" ? undefined : filtroPlan,
  );
  const { data: planes } = usePlanesDiagnostico();
  const { data: tipos } = useTiposAnalisis();
  const eliminar = useEliminarDocumentoRequerido();

  const planesPropietario = useMemo(
    () =>
      (planes ?? [])
        .filter((p: any) => p.codigo !== "gratuito")
        .map((p: any) => ({ id: p.id, nombre: p.nombre, codigo: p.codigo })),
    [planes],
  );

  const tiposOpts = useMemo(
    () =>
      (tipos ?? [])
        .filter((t) => !["valoracion_referencial", "score_viabilidad"].includes(t.codigo))
        .map((t) => ({ id: t.id, nombre: t.nombre })),
    [tipos],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Documentos requeridos por plan</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Define qué documentos debe entregar el cliente por cada análisis.
              Los <strong>obligatorios</strong> cuentan como pendientes en el portal.
            </p>
          </div>
          <Button size="sm" onClick={() => setCrearOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar documento
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroPlan} onValueChange={setFiltroPlan}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los planes</SelectItem>
              {planesPropietario.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !docs || docs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay documentos configurados
              {filtroPlan !== "all" ? " para este plan" : ""}.
            </p>
            <Button size="sm" variant="outline" onClick={() => setCrearOpen(true)}>
              Agregar el primero
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Análisis</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => {
                  const plan = planesPropietario.find((p) => p.id === doc.plan_id);
                  const tipo = tiposOpts.find((t) => t.id === doc.tipo_analisis_id);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="tabular-nums">{doc.orden}</TableCell>
                      <TableCell>
                        <div className="font-medium">{doc.nombre}</div>
                        {doc.descripcion && (
                          <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {doc.descripcion}
                          </div>
                        )}
                        {!doc.activo && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tipo?.nombre ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{plan?.nombre ?? "—"}</TableCell>
                      <TableCell>
                        {doc.opcional ? (
                          <Badge variant="outline">Opcional</Badge>
                        ) : (
                          <Badge>Obligatorio</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditando(doc)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Eliminar "{doc.nombre}" del plan. Los engagements
                                  existentes ya no lo verán como requerido, pero los
                                  documentos subidos se conservan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => eliminar.mutate(doc.id)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {crearOpen && (
        <DocumentoRequeridoFormDialog
          open={crearOpen}
          onOpenChange={setCrearOpen}
          modo="crear"
          planes={planesPropietario}
          tipos={tiposOpts}
        />
      )}
      {editando && (
        <DocumentoRequeridoFormDialog
          open={!!editando}
          onOpenChange={(o) => !o && setEditando(null)}
          modo="editar"
          documento={editando}
          planes={planesPropietario}
          tipos={tiposOpts}
        />
      )}
    </Card>
  );
};

export default DocumentosRequeridosManager;
