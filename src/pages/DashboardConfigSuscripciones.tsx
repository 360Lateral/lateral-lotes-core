import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreciosSuscripcionAdmin } from "@/hooks/usePreciosSuscripcionAdmin";
import { useActualizarPreciosSuscripcion } from "@/hooks/useActualizarPreciosSuscripcion";
import { useConfigPayPerView } from "@/hooks/useConfigPayPerView";
import { useActualizarConfigPayPerView } from "@/hooks/useActualizarConfigPayPerView";
import { Loader2, Save } from "lucide-react";

const NIVEL_LABEL: Record<string, string> = {
  basico: "Básico",
  profesional: "Profesional",
  premium: "Premium",
};

const DashboardConfigSuscripciones = () => {
  const { data: precios, isLoading } = usePreciosSuscripcionAdmin();
  const guardarPrecios = useActualizarPreciosSuscripcion();
  const { data: config, isLoading: loadingConfig } = useConfigPayPerView();
  const guardarConfig = useActualizarConfigPayPerView();

  const [edit, setEdit] = useState<Record<string, { precio_cop: number; activo: boolean }>>({});
  const [ppv, setPpv] = useState<{ precio_cop: number; dias_acceso: number; activo: boolean }>({
    precio_cop: 0,
    dias_acceso: 0,
    activo: true,
  });

  useEffect(() => {
    if (precios) {
      const e: Record<string, { precio_cop: number; activo: boolean }> = {};
      precios.forEach((p) => (e[p.id] = { precio_cop: p.precio_cop, activo: p.activo }));
      setEdit(e);
    }
  }, [precios]);

  useEffect(() => {
    if (config) {
      setPpv({ precio_cop: config.precio_cop, dias_acceso: config.dias_acceso, activo: config.activo });
    }
  }, [config]);

  const handleGuardarPrecios = () => {
    const rows = Object.entries(edit).map(([id, v]) => ({ id, ...v }));
    guardarPrecios.mutate(rows);
  };

  return (
    <DashboardLayout title="Precios y planes">
      <div className="space-y-8 max-w-5xl">
        {/* Precios de suscripción */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Precios de suscripción</h2>
              <p className="text-sm text-muted-foreground">
                Configura el precio por nivel y periodo. Se reflejan en /suscripcion.
              </p>
            </div>
            <Button onClick={handleGuardarPrecios} disabled={guardarPrecios.isPending}>
              {guardarPrecios.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar precios
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Nivel</th>
                    <th className="py-2 pr-3">Periodo</th>
                    <th className="py-2 pr-3">Precio (COP)</th>
                    <th className="py-2 pr-3">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {(precios ?? []).map((p) => {
                    const v = edit[p.id] ?? { precio_cop: p.precio_cop, activo: p.activo };
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{NIVEL_LABEL[p.nivel] ?? p.nivel}</td>
                        <td className="py-2 pr-3">{p.periodo_meses} {p.periodo_meses === 1 ? "mes" : "meses"}</td>
                        <td className="py-2 pr-3">
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
                            className="w-40"
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <Switch
                            checked={v.activo}
                            onCheckedChange={(c) =>
                              setEdit((prev) => ({
                                ...prev,
                                [p.id]: { ...v, activo: c },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pay-per-view */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Pay-per-view</h2>
              <p className="text-sm text-muted-foreground">
                Configura el precio y el periodo de acceso al desbloquear un lote individual.
              </p>
            </div>
            <Button onClick={() => guardarConfig.mutate(ppv)} disabled={guardarConfig.isPending || loadingConfig}>
              {guardarConfig.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>

          {loadingConfig ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ppv-precio">Precio (COP)</Label>
                <Input
                  id="ppv-precio"
                  type="number"
                  min={0}
                  value={ppv.precio_cop}
                  onChange={(e) => setPpv((p) => ({ ...p, precio_cop: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="ppv-dias">Días de acceso</Label>
                <Input
                  id="ppv-dias"
                  type="number"
                  min={1}
                  value={ppv.dias_acceso}
                  onChange={(e) => setPpv((p) => ({ ...p, dias_acceso: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="ppv-activo"
                    checked={ppv.activo}
                    onCheckedChange={(c) => setPpv((p) => ({ ...p, activo: c }))}
                  />
                  <Label htmlFor="ppv-activo">Activo</Label>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardConfigSuscripciones;
