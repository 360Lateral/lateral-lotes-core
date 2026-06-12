import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePreciosSuscripcionAdmin } from "@/hooks/usePreciosSuscripcionAdmin";
import { useActualizarPreciosSuscripcion } from "@/hooks/useActualizarPreciosSuscripcion";
import { useConfigPayPerView } from "@/hooks/useConfigPayPerView";
import { useActualizarConfigPayPerView } from "@/hooks/useActualizarConfigPayPerView";
import { AlertCircle, CreditCard, Save, Settings2 } from "lucide-react";
import { formatCOP } from "@/lib/format";

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  profesional: "Profesional",
  premium: "Premium",
};
const NIVEL_ORDER = ["basico", "profesional", "premium"];

type PrecioEdit = { precio_cop: number; activo: boolean };

const DashboardConfigSuscripciones = () => {
  const { data: precios, isLoading } = usePreciosSuscripcionAdmin();
  const guardarPrecios = useActualizarPreciosSuscripcion();
  const { data: config, isLoading: loadingConfig } = useConfigPayPerView();
  const guardarConfig = useActualizarConfigPayPerView();

  const [edit, setEdit] = useState<Record<string, PrecioEdit>>({});
  const [original, setOriginal] = useState<Record<string, PrecioEdit>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ppv, setPpv] = useState<{ precio_cop: number; dias_acceso: number; activo: boolean }>({
    precio_cop: 0, dias_acceso: 0, activo: true,
  });

  useEffect(() => {
    if (precios) {
      const e: Record<string, PrecioEdit> = {};
      precios.forEach((p) => (e[p.id] = { precio_cop: p.precio_cop, activo: p.activo }));
      setEdit(e);
      setOriginal(e);
    }
  }, [precios]);

  useEffect(() => {
    if (config) setPpv({ precio_cop: config.precio_cop, dias_acceso: config.dias_acceso, activo: config.activo });
  }, [config]);

  const preciosPorNivel = useMemo(() => {
    const map: Record<string, typeof precios> = {};
    (precios ?? []).forEach((p) => {
      (map[p.nivel] ||= []).push(p);
    });
    Object.values(map).forEach((arr) => arr?.sort((a, b) => a.periodo_meses - b.periodo_meses));
    return map;
  }, [precios]);

  const cambiosPendientes = useMemo(() => {
    return Object.entries(edit).filter(([id, v]) => {
      const o = original[id];
      return !o || o.precio_cop !== v.precio_cop || o.activo !== v.activo;
    });
  }, [edit, original]);
  const tieneCambios = cambiosPendientes.length > 0;

  const handleGuardar = () => {
    const rows = cambiosPendientes.map(([id, v]) => ({ id, ...v }));
    guardarPrecios.mutate(rows, {
      onSuccess: () => {
        setOriginal({ ...edit });
        setConfirmOpen(false);
      },
    });
  };

  const descartar = () => setEdit({ ...original });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Settings2 className="h-5 w-5" /> Configuración de suscripciones
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Precios de los planes para desarrolladores y configuración del pay-per-view.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
            <AlertCircle className="h-3 w-3" />
            Los cambios solo afectan nuevas suscripciones
          </div>
        </header>

        {/* Precios por nivel */}
        <div className="mb-2">
          <h2 className="text-sm font-semibold text-foreground">Precios de suscripción</h2>
          <p className="text-[11px] text-muted-foreground">Configura el precio por nivel y periodo.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {NIVEL_ORDER.filter((n) => preciosPorNivel[n]?.length).map((nivel) => {
              const items = preciosPorNivel[nivel] ?? [];
              const esPremium = nivel === "premium";
              return (
                <Card key={nivel} className={esPremium ? "border-2 border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{NIVEL_LABEL[nivel] ?? nivel}</CardTitle>
                      {esPremium && (
                        <Badge className="bg-primary text-[10px] text-primary-foreground">Top tier</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((p) => {
                      const v = edit[p.id] ?? { precio_cop: p.precio_cop, activo: p.activo };
                      const cambiado =
                        original[p.id] &&
                        (original[p.id].precio_cop !== v.precio_cop || original[p.id].activo !== v.activo);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 ${
                            cambiado ? "border-primary/60 bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-foreground">
                              {p.periodo_meses} {p.periodo_meses === 1 ? "mes" : "meses"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatCOP(Math.round(v.precio_cop / p.periodo_meses))}/mes prom.
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              value={v.precio_cop}
                              onChange={(e) =>
                                setEdit((prev) => ({
                                  ...prev,
                                  [p.id]: { ...v, precio_cop: Number(e.target.value) },
                                }))
                              }
                              className="h-7 w-28 text-right text-xs"
                            />
                            <Switch
                              checked={v.activo}
                              onCheckedChange={(c) =>
                                setEdit((prev) => ({ ...prev, [p.id]: { ...v, activo: c } }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pay-per-view */}
        <div className="mt-6 mb-2">
          <h2 className="text-sm font-semibold text-foreground">Pay-per-view</h2>
          <p className="text-[11px] text-muted-foreground">
            Precio y periodo de acceso al desbloquear un lote individual.
          </p>
        </div>
        <Card>
          <CardContent className="pt-5">
            {loadingConfig ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <Label htmlFor="ppv-precio" className="text-xs">Precio (COP)</Label>
                  <Input id="ppv-precio" type="number" min={0}
                    value={ppv.precio_cop}
                    onChange={(e) => setPpv((p) => ({ ...p, precio_cop: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ppv-dias" className="text-xs">Días de acceso</Label>
                  <Input id="ppv-dias" type="number" min={1}
                    value={ppv.dias_acceso}
                    onChange={(e) => setPpv((p) => ({ ...p, dias_acceso: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch id="ppv-activo" checked={ppv.activo}
                      onCheckedChange={(c) => setPpv((p) => ({ ...p, activo: c }))} />
                    <Label htmlFor="ppv-activo" className="text-xs">Activo</Label>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    onClick={() => guardarConfig.mutate(ppv)}
                    disabled={guardarConfig.isPending}
                  >
                    <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Guardar PPV
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sticky save bar */}
        {tieneCambios && (
          <div className="sticky bottom-4 mt-4 flex justify-end">
            <Card className="px-4 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {cambiosPendientes.length} {cambiosPendientes.length === 1 ? "cambio" : "cambios"} sin guardar
                </span>
                <Button size="sm" variant="outline" onClick={descartar} disabled={guardarPrecios.isPending}>
                  Descartar
                </Button>
                <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={guardarPrecios.isPending}>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Guardar cambios
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambios de precios</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a actualizar {cambiosPendientes.length} {cambiosPendientes.length === 1 ? "precio" : "precios"} de suscripción.
              Solo afecta nuevas suscripciones; las activas conservan su precio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGuardar}>Aplicar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardConfigSuscripciones;
