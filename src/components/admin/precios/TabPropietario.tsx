import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Star } from "lucide-react";
import { formatCOP } from "@/lib/format";
import {
  usePlanesDiagnostico,
  usePlanesAnalisis,
  type PlanDiagnostico,
  type PlanAnalisisRow,
} from "@/hooks/usePlanesConfig";
import { useTiposAnalisis } from "@/hooks/useTiposAnalisis";
import { useSmlmvVigente } from "@/hooks/useSmlmvVigente";

type Draft = Pick<
  PlanDiagnostico,
  "nombre" | "precio_smlmv" | "descripcion_corta" | "para_quien" | "recomendado"
>;

const TabPropietario = () => {
  const { data: planes, isLoading: loadingPlanes, update } = usePlanesDiagnostico();
  const { data: matriz, isLoading: loadingMatriz, upsertMany } = usePlanesAnalisis();
  const { data: tipos, isLoading: loadingTipos } = useTiposAnalisis();
  const { data: smlmv } = useSmlmvVigente();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [incluidos, setIncluidos] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (planes) {
      const d: Record<string, Draft> = {};
      planes.forEach((p) => {
        d[p.id] = {
          nombre: p.nombre,
          precio_smlmv: p.precio_smlmv ?? 0,
          descripcion_corta: p.descripcion_corta ?? "",
          para_quien: p.para_quien ?? "",
          recomendado: p.recomendado,
        };
      });
      setDrafts(d);
    }
  }, [planes]);

  useEffect(() => {
    if (matriz) {
      const m: Record<string, Set<string>> = {};
      matriz.forEach((row) => {
        if (row.incluido) {
          (m[row.plan_id] ||= new Set()).add(row.tipo_analisis_id);
        }
      });
      setIncluidos(m);
    }
  }, [matriz]);

  const tiposActivos = useMemo(() => (tipos ?? []).filter((t) => t.activo), [tipos]);

  const handleRecomendado = (planId: string, value: boolean) => {
    setDrafts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], recomendado: id === planId ? value : false };
      });
      return next;
    });
  };

  const guardarPlan = async (plan: PlanDiagnostico) => {
    const d = drafts[plan.id];
    if (!d) return;
    await update.mutateAsync({ id: plan.id, ...d });

    // sync recomendado en los demás si es necesario (solo uno true)
    if (d.recomendado) {
      for (const otro of planes ?? []) {
        if (otro.id !== plan.id && otro.recomendado) {
          await update.mutateAsync({ id: otro.id, recomendado: false });
        }
      }
    }

    // sync matriz de análisis
    const setIds = incluidos[plan.id] ?? new Set();
    const rows: PlanAnalisisRow[] = tiposActivos.map((t) => ({
      plan_id: plan.id,
      tipo_analisis_id: t.id,
      incluido: setIds.has(t.id),
      peso_avance: 1,
    }));
    await upsertMany.mutateAsync(rows);
  };

  if (loadingPlanes || loadingMatriz || loadingTipos) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Planes para propietarios</h2>
          <p className="text-[11px] text-muted-foreground">
            Pago único por lote. El precio se calcula en SMLMV vigente.
          </p>
        </div>
        {smlmv && (
          <Badge variant="outline" className="text-[10px]">
            1 SMLMV ({smlmv.anio}) = {formatCOP(smlmv.monto)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {(planes ?? []).map((plan) => {
          const d = drafts[plan.id];
          if (!d) return null;
          const montoCalculado = (d.precio_smlmv ?? 0) * (smlmv?.monto ?? 0);
          return (
            <Card
              key={plan.id}
              className={d.recomendado ? "border-2 border-primary" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{d.nombre || plan.codigo}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Star
                      className={`h-3.5 w-3.5 ${
                        d.recomendado ? "text-primary fill-primary" : "text-muted-foreground/40"
                      }`}
                    />
                    <Switch
                      checked={d.recomendado}
                      onCheckedChange={(c) => handleRecomendado(plan.id, c)}
                    />
                    <Label className="text-[10px]">Recomendado</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={d.nombre}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [plan.id]: { ...d, nombre: e.target.value } }))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Factor SMLMV</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={d.precio_smlmv ?? 0}
                      onChange={(e) =>
                        setDrafts((p) => ({
                          ...p,
                          [plan.id]: { ...d, precio_smlmv: Number(e.target.value) },
                        }))
                      }
                      className="h-8 text-sm"
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      = {formatCOP(montoCalculado)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">
                    Descripción corta <span className="text-muted-foreground">(máx 100)</span>
                  </Label>
                  <Textarea
                    value={d.descripcion_corta ?? ""}
                    maxLength={100}
                    rows={2}
                    onChange={(e) =>
                      setDrafts((p) => ({
                        ...p,
                        [plan.id]: { ...d, descripcion_corta: e.target.value },
                      }))
                    }
                    className="text-sm"
                    placeholder="Ej. Para evaluar viabilidad legal y normativa"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Para quién es <span className="text-muted-foreground">(máx 80)</span>
                  </Label>
                  <Textarea
                    value={d.para_quien ?? ""}
                    maxLength={80}
                    rows={2}
                    onChange={(e) =>
                      setDrafts((p) => ({
                        ...p,
                        [plan.id]: { ...d, para_quien: e.target.value },
                      }))
                    }
                    className="text-sm"
                    placeholder="Ej. Propietarios que quieren certeza legal"
                  />
                </div>

                <div>
                  <Label className="text-xs mb-1.5 block">Análisis incluidos</Label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border p-2">
                    {tiposActivos.map((t) => {
                      const checked = (incluidos[plan.id] ?? new Set()).has(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-1.5 text-xs cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setIncluidos((prev) => {
                                const next = { ...prev };
                                const set = new Set(next[plan.id] ?? []);
                                if (c) set.add(t.id);
                                else set.delete(t.id);
                                next[plan.id] = set;
                                return next;
                              })
                            }
                          />
                          <span>{t.nombre}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => guardarPlan(plan)}
                  disabled={update.isPending || upsertMany.isPending}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Guardar plan
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default TabPropietario;
