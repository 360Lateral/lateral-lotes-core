import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, FileText } from "lucide-react";
import { useContratosMarco, ContratoMarco } from "@/hooks/useContratosMarco";
import { useTiposAnalisis } from "@/hooks/useTiposAnalisis";
import NuevaVersionContratoDialog from "@/components/contratos/NuevaVersionContratoDialog";
import HistorialContratosDialog from "@/components/contratos/HistorialContratosDialog";

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const DashboardContratosMarco = () => {
  const { data: todos = [], isLoading } = useContratosMarco(false);
  const { data: tipos = [] } = useTiposAnalisis();

  const [verContenido, setVerContenido] = useState<ContratoMarco | null>(null);
  const [nuevaVersionDe, setNuevaVersionDe] = useState<ContratoMarco | null>(null);
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

  return (
    <DashboardLayout>
      <div className="space-y-1 mb-6">
        <h1 className="font-display text-2xl font-bold">
          Contratos marco — Plantillas legales por tipo de análisis
        </h1>
        <p className="text-sm text-muted-foreground">
          Cada experto firma un contrato marco específico al postular a una orden de servicio. Las
          versiones son inmutables para preservar el audit legal.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando contratos...</p>
      ) : (
        <Tabs defaultValue="vigentes">
          <TabsList>
            <TabsTrigger value="vigentes">Vigentes</TabsTrigger>
            <TabsTrigger value="historial">Historial completo</TabsTrigger>
          </TabsList>

          <TabsContent value="vigentes" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {tiposActivos.map((t) => {
                const c = vigentePorTipo.get(t.id);
                if (!c) {
                  return (
                    <Card key={t.id} className="border-destructive">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          {t.nombre}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-destructive">
                          ⚠ Sin contrato vigente. Los expertos no pueden postular a órdenes de este
                          tipo hasta que actives uno.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setHistorialTipo({ id: t.id, nombre: t.nombre })}
                        >
                          Ver historial
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <Card key={t.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{t.nombre}</span>
                        <Badge>{c.version}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Precio: </span>
                        {fmtCOP(c.precio_min)} – {fmtCOP(c.precio_max)}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Plazo: </span>
                        {c.plazo_min_dias} – {c.plazo_max_dias} días
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => setVerContenido(c)}>
                          Ver contenido
                        </Button>
                        <Button size="sm" onClick={() => setNuevaVersionDe(c)}>
                          Crear nueva versión
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHistorialTipo({ id: t.id, nombre: t.nombre })}
                        >
                          Ver historial
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <Accordion type="multiple" className="space-y-2">
              {tiposActivos.map((t) => {
                const versiones = versionesPorTipo.get(t.id) ?? [];
                return (
                  <AccordionItem key={t.id} value={t.id} className="border rounded-md px-3">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t.nombre}
                        <Badge variant="secondary" className="ml-2">
                          {versiones.length} versión(es)
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistorialTipo({ id: t.id, nombre: t.nombre })}
                      >
                        Abrir gestión de historial
                      </Button>
                      <div className="mt-3 space-y-1 text-sm">
                        {versiones.map((c) => (
                          <div
                            key={c.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded border p-2"
                          >
                            <span className="font-semibold">{c.version}</span>
                            {c.activo ? (
                              <Badge>Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {fmtCOP(c.precio_min)} – {fmtCOP(c.precio_max)} •{" "}
                              {c.plazo_min_dias}–{c.plazo_max_dias}d
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString("es-CO")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!verContenido} onOpenChange={(v) => !v && setVerContenido(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {verContenido?.tipos_analisis?.nombre} — {verContenido?.version}
            </DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded">
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
