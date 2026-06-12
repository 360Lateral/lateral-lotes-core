import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLotesPendientesValidacion } from "@/hooks/useLotesPendientesValidacion";
import { useValidarLote } from "@/hooks/useValidarLote";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, User, Calendar, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const fmtCOP = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

const DashboardLotesPendientesValidacion = () => {
  const { data: lotes = [], isLoading } = useLotesPendientesValidacion();
  const validar = useValidarLote();

  const [ajustesOpen, setAjustesOpen] = useState(false);
  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [loteSel, setLoteSel] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const openAjustes = (id: string) => {
    setLoteSel(id);
    setMotivo("");
    setAjustesOpen(true);
  };

  const openRechazo = (id: string) => {
    setLoteSel(id);
    setRechazoOpen(true);
  };

  const confirmAjustes = () => {
    if (!loteSel || motivo.trim().length === 0) return;
    validar.mutate(
      { lote_id: loteSel, decision: "rechazado", notas: motivo.trim() },
      { onSettled: () => setAjustesOpen(false) }
    );
  };

  const confirmRechazo = () => {
    if (!loteSel) return;
    validar.mutate(
      { lote_id: loteSel, decision: "rechazado", notas: "Rechazado por 360Lateral" },
      { onSettled: () => setRechazoOpen(false) }
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <header className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl text-foreground">Validación de activos pendientes</h1>
            <p className="font-body text-sm text-muted-foreground">
              {lotes.length} {lotes.length === 1 ? "lote esperando" : "lotes esperando"} revisión
            </p>
          </div>
        </header>

        {isLoading && <p className="font-body text-sm text-muted-foreground">Cargando…</p>}

        {!isLoading && lotes.length === 0 && (
          <EmptyState
            icon={CheckCircle2}
            titulo="No hay lotes pendientes de validación"
            descripcion="Cuando los propietarios envíen nuevos lotes, aparecerán aquí para tu revisión."
          />
        )}

        <div className="flex flex-col gap-4">
          {lotes.map((lote) => {
            const prop = lote.perfiles;
            const busy = validar.isPending && loteSel === lote.id;
            return (
              <Card key={lote.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row">
                  <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-md bg-muted md:h-32 md:w-44">
                    <MapPin className="h-8 w-8 text-muted-foreground/40" />
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg text-foreground">
                          {lote.nombre_lote || "(sin nombre)"}
                        </h2>
                        <Badge variant="secondary">Pendiente</Badge>
                      </div>
                      <p className="font-body text-sm text-muted-foreground">
                        {[lote.barrio, lote.ciudad].filter(Boolean).join(" · ") || "Ubicación no especificada"}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Precio sugerido</dt>
                        <dd className="text-foreground">{fmtCOP(lote.precio_venta_estimado)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Solicitado
                        </dt>
                        <dd className="text-foreground">{fmtDate(lote.created_at)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Propietario
                        </dt>
                        <dd className="text-foreground">
                          {prop?.nombre || "—"}
                          {prop?.email && (
                            <span className="ml-2 text-muted-foreground">({prop.email})</span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={busy}
                        onClick={() => {
                          setLoteSel(lote.id);
                          validar.mutate({ lote_id: lote.id, decision: "aprobado" });
                        }}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500 text-amber-700 hover:bg-amber-50"
                        disabled={busy}
                        onClick={() => openAjustes(lote.id)}
                      >
                        <AlertTriangle className="mr-1 h-4 w-4" /> Solicitar ajustes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        disabled={busy}
                        onClick={() => openRechazo(lote.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Rechazar definitivamente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Solicitar ajustes */}
      <Dialog open={ajustesOpen} onOpenChange={setAjustesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar ajustes</DialogTitle>
            <DialogDescription>
              El propietario recibirá este mensaje. Sé claro y específico.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ej: Falta dirección exacta, agregar foto frontal del lote, etc."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAjustesOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAjustes}
              disabled={motivo.trim().length === 0 || validar.isPending}
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rechazar definitivamente */}
      <Dialog open={rechazoOpen} onOpenChange={setRechazoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Rechazar definitivamente?</DialogTitle>
            <DialogDescription>
              Esta acción retira el lote del flujo de validación. El propietario será notificado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRechazoOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRechazo}
              disabled={validar.isPending}
            >
              Sí, rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardLotesPendientesValidacion;
