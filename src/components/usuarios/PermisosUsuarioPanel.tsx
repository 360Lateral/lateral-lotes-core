import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PERMISOS_USUARIO, estadoPermisos, plantillaSoloLectura, type EstadoPermisos } from "@/lib/permisos-usuario";

interface Props {
  userId: string;
  nombre: string;
  nombres: Record<string, string>;
}

export default function PermisosUsuarioPanel({ userId, nombre, nombres }: Props) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<EstadoPermisos | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const permisos = useQuery({
    queryKey: ["admin-permisos-usuario", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("permisos_usuario").select("permiso,habilitado,actualizado_por,actualizado_en").eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });
  const historial = useQuery({
    queryKey: ["admin-audit-permisos", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_permisos_usuario").select("id,permiso,habilitado_nuevo,cambiado_por,cambiado_en").eq("user_id", userId).order("cambiado_en", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });
  const original = estadoPermisos(permisos.data ?? []);
  const valores = draft ?? original;
  const cambios = PERMISOS_USUARIO.filter(({ id }) => valores[id] !== original[id]);
  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("guardar_permisos_usuario", {
        p_user_id: userId,
        p_permisos: Object.fromEntries(cambios.map(({ id }) => [id, valores[id]])),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-permisos-usuario", userId] }),
        client.invalidateQueries({ queryKey: ["admin-audit-permisos", userId] }),
        client.invalidateQueries({ queryKey: ["permisos-acciones"] }),
      ]);
      setDraft(null);
      setConfirmar(false);
      toast.success("Permisos guardados");
    },
    onError: () => toast.error("No se pudieron guardar los permisos"),
  });

  return (
    <section className="space-y-3 border-t border-border pt-4" aria-label="Permisos del usuario">
      <h3 className="font-medium text-foreground">Permisos</h3>
      {permisos.isLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Cargando permisos" /> : permisos.isError ? (
        <div className="space-y-2"><p className="text-sm text-destructive">No se pudieron cargar los permisos.</p><Button variant="outline" onClick={() => permisos.refetch()}>Reintentar</Button></div>
      ) : (
        <>
          {PERMISOS_USUARIO.map(({ id, label }) => (
            <div key={id} className="flex min-h-11 items-center justify-between gap-3">
              <Label htmlFor={`permiso-${userId}-${id}`} className="min-w-0 flex-1 text-base">{label}</Label>
              <Switch id={`permiso-${userId}-${id}`} checked={valores[id]} disabled={guardar.isPending} onCheckedChange={(checked) => setDraft({ ...valores, [id]: checked })} className="shrink-0" />
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="min-h-11 h-auto whitespace-normal py-2" disabled={guardar.isPending} onClick={() => setDraft(plantillaSoloLectura())}>Aplicar plantilla Solo lectura</Button>
            <Button className="min-h-11" disabled={!cambios.length || guardar.isPending} onClick={() => setConfirmar(true)}>Guardar permisos</Button>
          </div>
        </>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer py-2 font-medium">Historial de permisos</summary>
        {historial.isError ? <p className="text-destructive">No se pudo cargar el historial.</p> : historial.isLoading ? <p>Cargando…</p> : !historial.data?.length ? <p className="text-muted-foreground">Sin cambios registrados.</p> : (
          <ul className="max-h-48 space-y-3 overflow-y-auto py-2">
            {historial.data.map((fila) => (
              <li key={fila.id} className="break-words">
                <p>{PERMISOS_USUARIO.find(({ id }) => id === fila.permiso)?.label ?? fila.permiso}: {fila.habilitado_nuevo ? "Activado" : "Desactivado"}</p>
                <p className="text-xs text-muted-foreground">{fila.cambiado_por ? nombres[fila.cambiado_por] ?? fila.cambiado_por : "Sistema"} · {new Date(fila.cambiado_en).toLocaleString("es-CO")}</p>
              </li>
            ))}
          </ul>
        )}
      </details>
      <AlertDialog open={confirmar} onOpenChange={(open) => { if (!guardar.isPending) setConfirmar(open); }}>
        <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Guardar los permisos?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">Se actualizarán los permisos de {nombre} y quedará registrado quién realizó cada cambio.</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="space-y-2 text-sm">{cambios.map(({ id, label }) => <li key={id}>{label}: {valores[id] ? "Activar" : "Desactivar"}</li>)}</ul>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardar.isPending} className="min-h-11">Cancelar</AlertDialogCancel>
            <Button disabled={guardar.isPending} className="min-h-11" onClick={() => guardar.mutate()}>{guardar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Confirmar y guardar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}