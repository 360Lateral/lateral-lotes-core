import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, Square, Sparkles, RotateCcw } from "lucide-react";
import { compararCodigo, formatoFecha } from "@/lib/vid-diagnosticos";

type Fila = { codigo_activo: string; estado: string; nombre: string; ruta: string | null; motivo: string | null; drive_file_id: string };

async function invocar(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("vid-drive-sync", { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try { msg = (await error.context.json()).error ?? msg; } catch { /* ignore */ }
    }
    throw new Error(msg);
  }
  return data;
}

const ESTADOS: Record<string, string> = {
  pendiente: "Pendientes", procesado: "Leídos", requiere_revision: "Requieren revisión", error: "Con error", no_aplica: "Fotos y planos",
};

export default function VidImportacion() {
  const qc = useQueryClient();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const detener = useRef(false);

  const { data: archivos = [] } = useQuery({
    queryKey: ["vid-archivos"],
    queryFn: async () => {
      const out: Fila[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("vid_drive_archivos").select("codigo_activo, estado, nombre, ruta, motivo, drive_file_id").range(from, from + 999);
        if (error) throw error;
        out.push(...((data ?? []) as Fila[]));
        if (!data || data.length < 1000) break;
      }
      return out;
    },
  });
  const { data: ultima } = useQuery({
    queryKey: ["vid-sync-log"],
    queryFn: async () => (await supabase.from("vid_sync_log").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const { data: diags = [] } = useQuery({
    queryKey: ["vid-diagnosticos-equipo"],
    queryFn: async () => (await supabase.from("vid_diagnosticos").select("codigo_activo, nombre_activo, generado_at, documentos_procesados, requiere_revision")).data ?? [],
  });

  const refrescar = () => ["vid-archivos", "vid-sync-log", "vid-diagnosticos-equipo", "vid-diagnosticos"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const conteo: Record<string, number> = {};
  archivos.forEach((a) => (conteo[a.estado] = (conteo[a.estado] ?? 0) + 1));
  const documentos = archivos.filter((a) => a.estado !== "no_aplica").length;
  const hechos = documentos - (conteo.pendiente ?? 0);
  const revisar = archivos.filter((a) => a.estado === "requiere_revision" || a.estado === "error");

  const ejecutar = async (nombre: string, fn: () => Promise<void>) => {
    setOcupado(nombre); setMensaje(null); detener.current = false;
    try { await fn(); } catch (e) { setMensaje((e as Error).message); } finally { setOcupado(null); refrescar(); }
  };

  const sincronizar = () => ejecutar("sync", async () => {
    const r = await invocar({ accion: "sincronizar" });
    setMensaje(`Sincronización lista: ${r.nuevos} archivos nuevos, ${r.actualizados} actualizados.`);
  });

  const procesar = () => ejecutar("proc", async () => {
    for (;;) {
      if (detener.current) { setMensaje("Lectura detenida."); return; }
      const r = await invocar({ accion: "procesar", limite: 1 });
      refrescar();
      if (!r.procesados || r.restantes === 0) { setMensaje("Todos los documentos fueron leídos."); return; }
    }
  });

  const consolidar = () => ejecutar("cons", async () => {
    const codigos = [...new Set(archivos.filter((a) => a.estado === "procesado").map((a) => a.codigo_activo))].sort(compararCodigo);
    for (const c of codigos) {
      if (detener.current) { setMensaje("Generación detenida."); return; }
      setMensaje(`Generando diagnóstico de ${c}…`);
      await invocar({ accion: "consolidar", codigo: c });
      refrescar();
    }
    setMensaje(`Diagnósticos generados para ${codigos.length} activos.`);
  });

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Sincronización con Google Drive</h2>
            <p className="text-sm text-muted-foreground">Solo lectura. Nunca se modifica nada en Drive.</p>
            <p className="text-sm mt-1">Última sincronización: <strong>{ultima ? formatoFecha(ultima.created_at) + " " + new Date(ultima.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "Nunca"}</strong></p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button className="h-11" disabled={!!ocupado} onClick={sincronizar}><RefreshCw className={`h-4 w-4 mr-2 ${ocupado === "sync" ? "animate-spin" : ""}`} />1. Sincronizar</Button>
            <Button className="h-11" variant="secondary" disabled={!!ocupado || !conteo.pendiente} onClick={procesar}><Play className="h-4 w-4 mr-2" />2. Leer documentos</Button>
            <Button className="h-11" variant="secondary" disabled={!!ocupado || !conteo.procesado} onClick={consolidar}><Sparkles className="h-4 w-4 mr-2" />3. Generar diagnósticos</Button>
          </div>
        </div>
        {documentos > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm"><span>Documentos leídos</span><span>{hechos} de {documentos}</span></div>
            <Progress value={(hechos / documentos) * 100} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ESTADOS).map(([k, l]) => <Badge key={k} variant="outline">{l}: {conteo[k] ?? 0}</Badge>)}
        </div>
        {(ocupado || mensaje) && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            {mensaje && <p className="flex-1">{mensaje}</p>}
            {ocupado && ocupado !== "sync" && <Button variant="outline" className="h-11" onClick={() => (detener.current = true)}><Square className="h-4 w-4 mr-2" />Detener</Button>}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Diagnósticos por activo</h3>
        <ul className="divide-y divide-border">
          {[...diags].sort((a, b) => compararCodigo(a.codigo_activo, b.codigo_activo)).map((d) => {
            const del = archivos.filter((a) => a.codigo_activo === d.codigo_activo && a.estado !== "no_aplica");
            const leidos = del.filter((a) => a.estado === "procesado").length;
            return (
              <li key={d.codigo_activo} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                <span className="min-w-0"><strong>{d.codigo_activo}</strong> · {d.nombre_activo}</span>
                <span className="text-muted-foreground shrink-0">
                  {leidos}/{del.length} documentos · {d.requiere_revision ? "Requiere revisión" : d.generado_at ? `Generado ${formatoFecha(d.generado_at)}` : "Sin generar"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {revisar.length > 0 && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h3 className="font-semibold">Archivos que requieren revisión ({revisar.length})</h3>
            {!!conteo.error && (
              <Button variant="outline" className="h-11" disabled={!!ocupado} onClick={() => ejecutar("ret", async () => { await invocar({ accion: "reintentar" }); setMensaje("Los archivos con error volvieron a la cola."); })}>
                <RotateCcw className="h-4 w-4 mr-2" />Reintentar los que fallaron
              </Button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {revisar.map((a) => (
              <li key={a.drive_file_id} className="py-2.5 text-sm">
                <a href={`https://drive.google.com/file/d/${a.drive_file_id}/view`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-words">{a.nombre}</a>
                <p className="text-xs text-muted-foreground break-words">{a.codigo_activo} · {a.motivo}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
