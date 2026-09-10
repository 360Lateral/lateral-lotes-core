import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import EnviarFeedbackDialog from "@/components/feedback/EnviarFeedbackDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useDevRole } from "@/contexts/DevRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { RECORRIDOS, TOTAL_PASOS, type EstadoPaso, type PasoQA, type RecorridoQA } from "@/lib/qa-recorridos";
import { CheckCircle2, AlertTriangle, Circle, ExternalLink, MessageSquarePlus, RotateCcw } from "lucide-react";
import Seo from "@/components/Seo";

const STORAGE_KEY = "qa_progreso_v1";

type Progreso = Record<string, EstadoPaso>;

const leerProgreso = (): Progreso => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Progreso;
  } catch {
    return {};
  }
};

const DashboardQA = () => {
  const { isRealSuperAdmin, canUseQaMode, loading } = useAuth();
  const { setDevRole } = useDevRole();
  const navigate = useNavigate();
  const [progreso, setProgreso] = useState<Progreso>(leerProgreso);
  const [pasoReporte, setPasoReporte] = useState<{ paso: PasoQA; rec: RecorridoQA } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progreso));
    } catch {
      // ignore
    }
  }, [progreso]);

  const { data: hallazgos = [] } = useQuery({
    queryKey: ["qa-hallazgos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feedback_tickets")
        .select("titulo, estado")
        .in("estado", ["nuevo", "en_revision", "planificado", "en_progreso"])
        .ilike("titulo", "[QA]%");
      if (error) return [];
      return data ?? [];
    },
  });

  const hallazgosPorRecorrido = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of hallazgos as { titulo: string }[]) {
      const rec = RECORRIDOS.find((r) => h.titulo?.includes(`[QA][${r.titulo}]`));
      if (rec) m[rec.id] = (m[rec.id] ?? 0) + 1;
    }
    return m;
  }, [hallazgos]);

  if (loading) return null;
  if (!canUseQaMode) return <Navigate to="/dashboard" replace />;

  const estadoDe = (id: string): EstadoPaso => progreso[id] ?? "pendiente";

  const marcar = (id: string, estado: EstadoPaso) =>
    setProgreso((p) => ({ ...p, [id]: p[id] === estado ? "pendiente" : estado }));

  const irAlPaso = (rec: RecorridoQA, paso: PasoQA) => {
    setDevRole(rec.rol);
    navigate(paso.ruta);
  };

  const revisadosTotales = RECORRIDOS.reduce(
    (n, r) => n + r.pasos.filter((p) => estadoDe(p.id) !== "pendiente").length,
    0,
  );

  return (
    <DashboardLayout>
      <Seo
        title="Modo pruebas | 360Lateral"
        description="Recorrido guiado de pruebas por rol."
        path="/dashboard/qa"
        noindex
      />

      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Pruebas por rol</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Recorre cada proceso como si fueras cada tipo de usuario. Al entrar a un paso, el
            portal cambia automáticamente al rol correspondiente.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm font-medium text-foreground">
                Avance general: {revisadosTotales} de {TOTAL_PASOS} pasos revisados
              </p>
              <p className="font-body text-xs text-muted-foreground">
                Tu avance se guarda en este navegador.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProgreso({})}
              className="shrink-0"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
          <Progress
            value={TOTAL_PASOS ? (revisadosTotales / TOTAL_PASOS) * 100 : 0}
            className="mt-3 h-2"
          />
        </div>

        <Accordion type="multiple" className="space-y-3">
          {RECORRIDOS.map((rec) => {
            const revisados = rec.pasos.filter((p) => estadoDe(p.id) !== "pendiente").length;
            const conHallazgo = rec.pasos.filter((p) => estadoDe(p.id) === "hallazgo").length;
            return (
              <AccordionItem
                key={rec.id}
                value={rec.id}
                className="rounded-lg border border-border bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                    <span className="font-body font-semibold text-foreground">{rec.titulo}</span>
                    <Badge variant="secondary" className="font-normal">
                      {revisados}/{rec.pasos.length}
                    </Badge>
                    {conHallazgo > 0 && (
                      <Badge variant="destructive" className="font-normal">
                        {conHallazgo} con hallazgo
                      </Badge>
                    )}
                    {hallazgosPorRecorrido[rec.id] > 0 && (
                      <Badge variant="outline" className="font-normal">
                        {hallazgosPorRecorrido[rec.id]} reportes abiertos
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 font-body text-xs text-muted-foreground">{rec.descripcion}</p>
                  {rec.rol === "super_admin" && !isRealSuperAdmin && (
                    <p className="mb-3 rounded-md border border-border bg-muted/40 p-2 font-body text-xs text-muted-foreground">
                      Este recorrido es solo de lectura para tu perfil: no puedes activar la vista de
                      Super Admin.
                    </p>
                  )}
                  <ol className="space-y-2">
                    {rec.pasos.map((paso, i) => {
                      const estado = estadoDe(paso.id);
                      return (
                        <li
                          key={paso.id}
                          className={`rounded-lg border p-3 ${
                            estado === "ok"
                              ? "border-success/40 bg-success/5"
                              : estado === "hallazgo"
                                ? "border-destructive/40 bg-destructive/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-[220px] flex-1">
                              <p className="font-body text-sm font-medium text-foreground">
                                {i + 1}. {paso.titulo}
                              </p>
                              <p className="mt-1 font-body text-xs text-muted-foreground">
                                {paso.esperado}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Button
                                size="sm"
                                variant={estado === "ok" ? "default" : "outline"}
                                className="h-8"
                                onClick={() => marcar(paso.id, "ok")}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Correcto
                              </Button>
                              <Button
                                size="sm"
                                variant={estado === "hallazgo" ? "destructive" : "outline"}
                                className="h-8"
                                onClick={() => marcar(paso.id, "hallazgo")}
                              >
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                Hallazgo
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8"
                                onClick={() => setPasoReporte({ paso, rec })}
                              >
                                <MessageSquarePlus className="mr-1 h-3.5 w-3.5" />
                                Reportar
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8"
                                onClick={() => irAlPaso(rec, paso)}
                              >
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                Ir
                              </Button>
                            </div>
                          </div>
                          {estado === "pendiente" && (
                            <span className="mt-2 inline-flex items-center gap-1 font-body text-[11px] text-muted-foreground">
                              <Circle className="h-3 w-3" /> Pendiente de revisar
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <EnviarFeedbackDialog
        open={!!pasoReporte}
        onOpenChange={(v) => {
          if (!v) setPasoReporte(null);
        }}
        tipoInicial="ux"
        tituloInicial={
          pasoReporte ? `[QA][${pasoReporte.rec.titulo}] ${pasoReporte.paso.titulo}` : undefined
        }
        descripcionInicial={
          pasoReporte
            ? `Rol probado: ${pasoReporte.rec.titulo}\nPantalla: ${pasoReporte.paso.ruta}\nEsperado: ${pasoReporte.paso.esperado}\n\nQué encontré: `
            : undefined
        }
      />
    </DashboardLayout>
  );
};

export default DashboardQA;
