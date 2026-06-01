import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useAutorizacionesDeLote } from "@/hooks/useAutorizacionesDeLote";
import { useComisionistasList } from "@/hooks/useComisionistasList";
import { useCrearAutorizacion } from "@/hooks/useCrearAutorizacion";
import { useRevocarAutorizacion } from "@/hooks/useRevocarAutorizacion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Info } from "lucide-react";

const BUCKET = "documentos-comisionistas";

const schema = z.object({
  comisionista_id: z.string().uuid({ message: "Selecciona un comisionista" }),
  comision_pct: z.coerce.number().min(0.1, "Mínimo 0.1%").max(100, "Máximo 100%"),
  fecha_vencimiento: z.string().optional().or(z.literal("")),
  notas: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lote: { id: string; nombre: string | null };
}

export default function GestionarComisionistasDialog({ open, onOpenChange, lote }: Props) {
  const { user } = useAuth();
  const { data: autorizaciones = [], isLoading: loadingAut } = useAutorizacionesDeLote(lote.id);
  const { data: comisionistas = [], isLoading: loadingCom } = useComisionistasList();
  const crear = useCrearAutorizacion();
  const revocar = useRevocarAutorizacion();
  const [documento, setDocumento] = useState<File | null>(null);
  const [revocarTarget, setRevocarTarget] = useState<string | null>(null);
  const [motivoRevoke, setMotivoRevoke] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { comisionista_id: "", comision_pct: 3, fecha_vencimiento: "", notas: "" },
  });

  const activas = autorizaciones.filter((a: any) => a.estado === "activa");

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    if (!documento) {
      toast.error("Debes subir el documento de aceptación");
      return;
    }
    // Duplicate guard
    if (activas.some((a: any) => a.comisionista?.id === values.comisionista_id)) {
      toast.error("Ese comisionista ya tiene una autorización activa para este lote");
      return;
    }
    try {
      await crear.mutateAsync({
        lote_id: lote.id,
        propietario_id: user.id,
        comisionista_id: values.comisionista_id,
        comision_pct: values.comision_pct,
        documento,
        fecha_vencimiento: values.fecha_vencimiento || null,
        notas: values.notas || null,
      });
      form.reset({ comisionista_id: "", comision_pct: 3, fecha_vencimiento: "", notas: "" });
      setDocumento(null);
    } catch (e: any) {
      if (e?.code === "23505" || /unique/i.test(e?.message ?? "")) {
        toast.error("Ese comisionista ya tiene una autorización activa para este lote");
      }
    }
  };

  const openDocumento = async (path: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast.error("No se pudo abrir el documento");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const confirmarRevocar = async () => {
    if (!revocarTarget) return;
    await revocar.mutateAsync({
      autorizacionId: revocarTarget,
      motivo: motivoRevoke || undefined,
    });
    setRevocarTarget(null);
    setMotivoRevoke("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar comisionistas</DialogTitle>
            <DialogDescription>
              Lote: <span className="font-medium">{lote.nombre || "(sin nombre)"}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border bg-muted/40 p-3 text-xs flex gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Al autorizar un comisionista, este podrá exhibir tu lote a compradores. Si se concreta
              una venta, recibirá la comisión pactada. 360Lateral hace la intermediación.
            </p>
          </div>

          {/* Sección 1: activos */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Comisionistas autorizados</h3>
            {loadingAut ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : activas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este lote no tiene comisionistas autorizados.
              </p>
            ) : (
              <ul className="space-y-2">
                {activas.map((a: any) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {a.comisionista?.nombre || a.comisionista?.email || "—"}
                        </span>
                        <Badge variant="secondary">{Number(a.comision_pct)}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(a.created_at).toLocaleDateString("es-CO")}
                        {a.fecha_vencimiento &&
                          ` · Vence ${new Date(a.fecha_vencimiento).toLocaleDateString("es-CO")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.documento_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDocumento(a.documento_url)}
                        >
                          <FileText className="mr-1 h-4 w-4" /> Documento
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevocarTarget(a.id)}
                      >
                        Revocar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Sección 2: nueva autorización */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">Autorizar nuevo comisionista</h3>

            {comisionistas.length === 0 && !loadingCom ? (
              <p className="text-sm text-muted-foreground">
                No hay comisionistas registrados. Pide a 360Lateral que registre uno.
              </p>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label>Comisionista *</Label>
                  <Select
                    value={form.watch("comisionista_id")}
                    onValueChange={(v) =>
                      form.setValue("comisionista_id", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loadingCom ? "Cargando..." : "Selecciona un comisionista"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {comisionistas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre || c.email || c.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.comisionista_id && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.comisionista_id.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>Comisión pactada (%) *</Label>
                    <Input type="number" step="0.1" {...form.register("comision_pct")} />
                    {form.formState.errors.comision_pct && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.comision_pct.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Fecha de vencimiento (opcional)</Label>
                    <Input type="date" {...form.register("fecha_vencimiento")} />
                  </div>
                </div>

                <div>
                  <Label>Documento de aceptación *</Label>
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setDocumento(e.target.files?.[0] ?? null)}
                  />
                  {documento && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">{documento.name}</p>
                  )}
                </div>

                <div>
                  <Label>Notas (opcional)</Label>
                  <Textarea rows={2} {...form.register("notas")} />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={crear.isPending}>
                    {crear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Autorizar comisionista
                  </Button>
                </div>
              </form>
            )}
          </section>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revocarTarget} onOpenChange={(v) => !v && setRevocarTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar autorización?</AlertDialogTitle>
            <AlertDialogDescription>
              El comisionista dejará de representar este lote. Esta acción se notificará al
              comisionista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label>Motivo (opcional)</Label>
            <Textarea
              rows={2}
              value={motivoRevoke}
              onChange={(e) => setMotivoRevoke(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revocar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRevocar} disabled={revocar.isPending}>
              {revocar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
