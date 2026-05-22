import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMiPreferencia } from "@/hooks/useMiPreferencia";
import { Loader2 } from "lucide-react";

const PreferenciasUsuario = () => {
  const { data, isLoading, actualizar } = useMiPreferencia();
  const { toast } = useToast();
  const [digest, setDigest] = useState(true);

  useEffect(() => {
    if (data) setDigest(data.email_sla_digest);
  }, [data]);

  const cambiado = data ? digest !== data.email_sla_digest : false;

  const guardar = async () => {
    try {
      await actualizar.mutateAsync({ email_sla_digest: digest });
      toast({ title: "Preferencias guardadas" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Preferencias</h1>
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones por email</CardTitle>
            <CardDescription>
              Controla qué correos recibes desde 360Lateral.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
                  <div className="flex-1">
                    <Label htmlFor="digest" className="font-body text-sm font-semibold text-foreground">
                      Recibir digest diario de SLA por email
                    </Label>
                    <p className="mt-1 font-body text-xs text-muted-foreground">
                      Cada día a las 8:00 AM recibirás un email con tus engagements en riesgo.
                    </p>
                  </div>
                  <Switch id="digest" checked={digest} onCheckedChange={setDigest} />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={guardar} disabled={!cambiado || actualizar.isPending}>
                    {actualizar.isPending ? "Guardando…" : "Guardar"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PreferenciasUsuario;
