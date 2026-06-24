import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Save } from "lucide-react";
import { useSmlmvVigente } from "@/hooks/useSmlmvVigente";
import { useActualizarSmlmv } from "@/hooks/useActualizarSmlmv";
import { formatCOP } from "@/lib/format";

const TabGeneral = () => {
  const { data: vigente, isLoading } = useSmlmvVigente();
  const actualizar = useActualizarSmlmv();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    anio: new Date().getFullYear(),
    valor_cop: 0,
    decreto: "",
    vigente_desde: today,
    notas: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    actualizar.mutate(
      {
        anio: form.anio,
        valor_cop: form.valor_cop,
        decreto: form.decreto || null,
        vigente_desde: form.vigente_desde,
        notas: form.notas || null,
      },
      {
        onSuccess: () => {
          setForm({
            anio: new Date().getFullYear(),
            valor_cop: 0,
            decreto: "",
            vigente_desde: today,
            notas: "",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Salario Mínimo Mensual Legal Vigente (SMLMV)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : vigente ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Año vigente</p>
                  <p className="text-lg font-semibold">{vigente.anio}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monto SMLMV</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCOP(vigente.monto)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vigente desde</p>
                  <p className="text-sm">
                    {new Date(vigente.vigente_desde).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {vigente.decreto && (
                  <div>
                    <p className="text-xs text-muted-foreground">Decreto</p>
                    <p className="text-sm">{vigente.decreto}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Actualiza cada enero/febrero cuando el gobierno anuncie el nuevo SMLMV.
              Esto recalcula automáticamente los precios de los planes de propietario.
            </AlertDescription>
          </Alert>

          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm font-semibold">Registrar nuevo SMLMV</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">Año</Label>
                <Input
                  type="number"
                  min={2020}
                  max={2100}
                  required
                  value={form.anio}
                  onChange={(e) => setForm((f) => ({ ...f, anio: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Monto (COP)</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.valor_cop || ""}
                  onChange={(e) => setForm((f) => ({ ...f, valor_cop: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Vigente desde</Label>
                <Input
                  type="date"
                  required
                  value={form.vigente_desde}
                  onChange={(e) => setForm((f) => ({ ...f, vigente_desde: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Decreto (opcional)</Label>
                <Input
                  value={form.decreto}
                  onChange={(e) => setForm((f) => ({ ...f, decreto: e.target.value }))}
                  placeholder="Ej. Decreto 2422 de 2025"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notas (opcional)</Label>
              <Textarea
                rows={2}
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={actualizar.isPending || !form.valor_cop}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Guardar nuevo SMLMV
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabGeneral;
