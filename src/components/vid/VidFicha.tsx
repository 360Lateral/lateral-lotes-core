import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, AlertTriangle, Pencil, MapPin } from "lucide-react";
import CriticidadBadge from "./CriticidadBadge";
import {
  CRITICIDAD_ORDEN, NO_DISPONIBLE, driveFolderUrl, formatoFecha, type VidDiagnostico,
} from "@/lib/vid-diagnosticos";

const fmtM2 = (n?: number | null) => (n == null ? NO_DISPONIBLE : `${n.toLocaleString("es-CO")} m²`);

export default function VidFicha({ basePath, esEquipo }: { basePath: string; esEquipo: boolean }) {
  const { codigo } = useParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editando, setEditando] = useState(false);
  const [resumen, setResumen] = useState("");

  const { data: d, isLoading } = useQuery({
    queryKey: ["vid-diagnostico", codigo],
    queryFn: async () => {
      const { data, error } = await supabase.from("vid_diagnosticos").select("*").eq("codigo_activo", codigo!).maybeSingle();
      if (error) throw error;
      return data as unknown as VidDiagnostico | null;
    },
    enabled: !!codigo,
  });

  const guardar = async () => {
    const { error } = await supabase.from("vid_diagnosticos").update({ resumen }).eq("codigo_activo", codigo!);
    if (error) return toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
    setEditando(false);
    qc.invalidateQueries({ queryKey: ["vid-diagnostico", codigo] });
    qc.invalidateQueries({ queryKey: ["vid-diagnosticos"] });
    toast({ title: "Resumen actualizado" });
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (!d) return <Card className="p-10 text-center text-muted-foreground">Este diagnóstico no existe o no tienes acceso.</Card>;

  const datos = d.datos ?? {};
  const clave: [string, string][] = [
    ["Ciudad", d.ciudad ?? NO_DISPONIBLE],
    ["Tipo de inmueble", d.tipo_inmueble ?? NO_DISPONIBLE],
    ["Dirección del inmueble", datos.direccion_inmueble ?? NO_DISPONIBLE],
    ["Área del lote", fmtM2(datos.area_lote_m2)],
    ["Área construida", fmtM2(datos.area_construida_m2)],
    ["Matrícula inmobiliaria", datos.matricula_inmobiliaria ?? NO_DISPONIBLE],
    ["Uso actual", datos.uso_actual ?? NO_DISPONIBLE],
    ["Estado físico", datos.estado_fisico ?? NO_DISPONIBLE],
    ["Fecha del diagnóstico", formatoFecha(d.fecha_diagnostico)],
  ];
  const hallazgos = [...(d.hallazgos ?? [])].sort((a, b) => CRITICIDAD_ORDEN[a.criticidad] - CRITICIDAD_ORDEN[b.criticidad]);
  const plan = [...(d.plan_accion ?? [])].sort((a, b) => a.prioridad - b.prioridad);

  return (
    <div className="space-y-5">
      <Link to={basePath} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground min-h-11">
        <ArrowLeft className="h-4 w-4" /> Volver al portafolio
      </Link>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block rounded bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5">{d.codigo_activo}</span>
            <h1 className="font-display text-xl md:text-2xl font-semibold mt-2">{d.nombre_activo}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{d.ciudad ?? NO_DISPONIBLE}</p>
          </div>
          <CriticidadBadge nivel={d.criticidad} className="self-start" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button asChild variant="outline" className="h-11">
            <a href={driveFolderUrl(d.drive_folder_id)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Documentos originales en Drive
            </a>
          </Button>
          {d.lote_id && (
            <Button asChild variant="ghost" className="h-11">
              <Link to={`/lotes/${d.lote_id}`}>Ver lote en la plataforma</Link>
            </Button>
          )}
        </div>
        {esEquipo && d.requiere_revision && (
          <p className="mt-4 flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{d.motivo_revision ?? "Requiere revisión"}. El cliente no ve este diagnóstico.</p>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-lg">Resumen ejecutivo</h2>
          {esEquipo && !editando && (
            <Button variant="ghost" size="sm" className="h-10" onClick={() => { setResumen(d.resumen ?? ""); setEditando(true); }}>
              <Pencil className="h-4 w-4 mr-1.5" /> Editar
            </Button>
          )}
        </div>
        {editando ? (
          <div className="space-y-2">
            <Textarea value={resumen} onChange={(e) => setResumen(e.target.value)} rows={8} />
            <div className="flex gap-2">
              <Button onClick={guardar} className="h-11">Guardar</Button>
              <Button variant="outline" onClick={() => setEditando(false)} className="h-11">Cancelar</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line">{d.resumen ?? NO_DISPONIBLE}</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-3">Datos clave</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {clave.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="text-sm break-words">{v}</dd>
            </div>
          ))}
        </dl>
        {!!datos.adicionales?.length && (
          <dl className="mt-4 border-t border-border pt-4 space-y-3">
            {datos.adicionales.map((a, i) => (
              <div key={i}>
                <dt className="text-xs text-muted-foreground">{a.campo}</dt>
                <dd className="text-sm break-words">{a.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-3">Hallazgos principales</h2>
        {hallazgos.length === 0 ? <p className="text-sm text-muted-foreground">{NO_DISPONIBLE}</p> : (
          <ul className="space-y-3">
            {hallazgos.map((h, i) => (
              <li key={i} className="rounded-md border border-border p-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <p className="font-medium text-sm">{h.titulo}</p>
                  <CriticidadBadge nivel={h.criticidad} className="self-start" />
                </div>
                {h.area && <p className="text-xs text-muted-foreground mt-1">{h.area}</p>}
                <p className="text-sm mt-1.5">{h.descripcion}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-lg mb-3">Plan de acción</h2>
        {plan.length === 0 ? <p className="text-sm text-muted-foreground">{NO_DISPONIBLE}</p> : (
          <ol className="space-y-3">
            {plan.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">{p.prioridad}</span>
                <div className="min-w-0">
                  <p className="text-sm">{p.paso}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{[p.plazo, p.area].filter(Boolean).join(" · ")}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
