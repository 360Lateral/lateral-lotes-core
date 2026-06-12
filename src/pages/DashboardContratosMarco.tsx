import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, FileText, Check, Plus, ScrollText,
} from "lucide-react";
import { useContratosMarco, ContratoMarco } from "@/hooks/useContratosMarco";
import { useTiposAnalisis } from "@/hooks/useTiposAnalisis";
import NuevaVersionContratoDialog from "@/components/contratos/NuevaVersionContratoDialog";
import HistorialContratosDialog from "@/components/contratos/HistorialContratosDialog";
import { KPIEstado } from "@/components/ui/KPIEstado";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCOP } from "@/lib/format";

const DashboardContratosMarco = () => {
  const { data: todos = [], isLoading } = useContratosMarco(false);
  const { data: tipos = [] } = useTiposAnalisis();

  const [verContenido, setVerContenido] = useState<ContratoMarco | null>(null);
  const [nuevaVersionDe, setNuevaVersionDe] = useState<ContratoMarco | null>(null);
  const [nuevoParaTipo, setNuevoParaTipo] = useState<{ id: string; nombre: string } | null>(null);
  const [historialTipo, setHistorialTipo] = useState<{ id: string; nombre: string } | null>(null);

  const tiposActivos = useMemo(() => tipos.filter((t) => t.activo), [tipos]);

  const vigentePorTipo = useMemo(() => {
    const map = new Map<string, ContratoMarco>();
    todos.filter((c) => c.activo).forEach((c) => map.set(c.tipo_analisis_id, c));
    return map;
  }, [todos]);

  const versionesPorTipo = useMemo(() => {
    const map = new Map<string, ContratoMarco[]>();
    todos.forEach((c) => {
      const arr = map.get(c.tipo_analisis_id) ?? [];
      arr.push(c);
      map.set(c.tipo_analisis_id, arr);
    });
    map.forEach((arr) =>
      arr.sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    );
    return map;
  }, [todos]);

  const conContrato = tiposActivos.filter((t) => vigentePorTipo.has(t.id)).length;
  const sinContrato = tiposActivos.length - conContrato;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <ScrollText className="h-5 w-5" /> Contratos marco
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Plantillas legales por tipo de análisis. Las versiones son inmutables para preservar el audit legal.
            </p>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3">
          <KPIEstado
            label="Tipos de análisis"
            value={tiposActivos.length}
            icon={FileText}
            colorClass="text-foreground"
            iconColorClass="text-muted-foreground"
          />
          <KPIEstado
            label="Con contrato vigente"
            value={conContrato}
            icon={Check}
            colorClass="text-green-600"
          />
          <KPIEstado
            label="Sin contrato"
            value={sinContrato}
            icon={AlertTriangle}
            colorClass="text-primary"
            destacado={sinContrato > 0}
          />
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : tiposActivos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay tipos de análisis"
            description="Primero crea tipos de análisis en Configuración para asignarles contratos marco."
          />
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {tiposActivos.map((t) => {
              const contratoVigente = vigentePorTipo.get(t.id);
              const versiones = versionesPorTipo.get(t.id) ?? [];
              return (
                <AccordionItem
                  key={t.id}
                  value={t.id}
                  className="overflow-hidden rounded-md border border-border bg-background"
                >
                  <AccordionTrigger className="px-4 py-2.5 hover:bg-muted/30 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{t.nombre}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {versiones.length} {versiones.length === 1 ? "versión" : "versiones"}
                        </span>
                      </div>
                      {contratoVigente ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px] dark:bg-green-950/40 dark:text-green-300">
                          <Check className="mr-1 h-2.5 w-2.5" /> {contratoVigente.version}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
                          <AlertTriangle className="mr-1 h-2.5 w-2.5" /> Sin contrato
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-border bg-muted/20 px-4 py-3">
                    {contratoVigente ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <div className="text-[9px] uppercase text-muted-foreground">Precio</div>
                            <div className="font-semibold text-foreground">
                              {formatCOP(contratoVigente.precio_min)} – {formatCOP(contratoVigente.precio_max)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] uppercase text-muted-foreground">Plazo</div>
                            <div className="font-semibold text-foreground">
                              {contratoVigente.plazo_min_dias}–{contratoVigente.plazo_max_dias} días
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setVerContenido(contratoVigente)}>
                            Ver contenido
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setHistorialTipo({ id: t.id, nombre: t.nombre })}>
                            Historial
                          </Button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => setNuevaVersionDe(contratoVigente)}>
                            Nueva versión
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-3 text-center">
                        <p className="mb-3 text-xs text-muted-foreground">
                          Este tipo de análisis aún no tiene un contrato marco vigente.
                          Los expertos no pueden postular hasta que actives uno.
                        </p>
                        <Button size="sm" onClick={() => setNuevoParaTipo({ id: t.id, nombre: t.nombre })}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Crear primera versión
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      <Dialog open={!!verContenido} onOpenChange={(v) => !v && setVerContenido(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>
              {verContenido?.tipos_analisis?.nombre} — {verContenido?.version}
            </DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded bg-muted p-4 font-mono text-xs">
            {verContenido?.contenido_legal}
          </pre>
        </DialogContent>
      </Dialog>

      {nuevaVersionDe && (
        <NuevaVersionContratoDialog
          open={!!nuevaVersionDe}
          onOpenChange={(v) => !v && setNuevaVersionDe(null)}
          contratoActual={nuevaVersionDe}
        />
      )}

      {nuevoParaTipo && (
        <HistorialContratosDialog
          open={!!nuevoParaTipo}
          onOpenChange={(v) => !v && setNuevoParaTipo(null)}
          tipoAnalisisId={nuevoParaTipo.id}
          tipoAnalisisNombre={nuevoParaTipo.nombre}
        />
      )}

      {historialTipo && (
        <HistorialContratosDialog
          open={!!historialTipo}
          onOpenChange={(v) => !v && setHistorialTipo(null)}
          tipoAnalisisId={historialTipo.id}
          tipoAnalisisNombre={historialTipo.nombre}
        />
      )}
    </DashboardLayout>
  );
};

export default DashboardContratosMarco;
