import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, TrendingUp, Timer, CheckCircle2, Calendar, ShieldCheck, Mail } from "lucide-react";
import { useMiDesempeno } from "@/hooks/useMiDesempeno";

const badgeSla = (pct: number | null) => {
  if (pct === null) return <Badge variant="secondary">—</Badge>;
  if (pct >= 90) return <Badge className="bg-emerald-600 hover:bg-emerald-600">{pct}%</Badge>;
  if (pct >= 70) return <Badge className="bg-amber-500 hover:bg-amber-500">{pct}%</Badge>;
  return <Badge variant="destructive">{pct}%</Badge>;
};

const MiDesempenoPanel = () => {
  const { data, isLoading } = useMiDesempeno();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  const sinDatos =
    !data ||
    ((data.total_propuestas ?? 0) === 0 &&
      (data.total_invitaciones ?? 0) === 0 &&
      (data.servicios_completados ?? 0) === 0);

  if (sinDatos) {
    return (
      <Card>
        <CardContent className="p-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <Briefcase className="h-10 w-10" />
          <p>
            Aún no tienes propuestas. Empieza postulándote a una orden disponible.
          </p>
        </CardContent>
      </Card>
    );
  }

  const m = data!;
  const enPlazo =
    m.servicios_completados > 0 && m.sla_cumplido_pct !== null
      ? Math.round((m.sla_cumplido_pct / 100) * m.servicios_completados)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Mis propuestas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{m.total_propuestas}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                Ganadas {m.propuestas_ganadas}
              </Badge>
              <Badge className="bg-amber-500 hover:bg-amber-500">
                Rechazadas {m.propuestas_rechazadas}
              </Badge>
              <Badge variant="secondary">Retiradas {m.propuestas_retiradas}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Tasa de adjudicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">
              {m.tasa_adjudicacion_pct === null ? "—" : `${m.tasa_adjudicacion_pct}%`}
            </p>
            <Progress value={m.tasa_adjudicacion_pct ?? 0} />
            <p className="text-xs text-muted-foreground">
              {m.propuestas_ganadas} de {m.total_propuestas} propuestas adjudicadas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4" /> Tiempo de respuesta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">
              {m.tiempo_respuesta_horas_avg === null
                ? "—"
                : `${m.tiempo_respuesta_horas_avg} h`}
            </p>
            <p className="text-xs text-muted-foreground">
              Promedio desde que se abre la orden hasta que envías tu propuesta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Servicios completados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{m.servicios_completados}</p>
            <p className="text-xs text-muted-foreground">
              {enPlazo} entregado{enPlazo === 1 ? "" : "s"} en plazo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Tiempo de entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">
              {m.tiempo_entrega_dias_avg === null ? "—" : `${m.tiempo_entrega_dias_avg} d`}
            </p>
            <p className="text-xs text-muted-foreground">
              Promedio entre que aceptas el trabajo y lo entregas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> SLA cumplido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              {badgeSla(m.sla_cumplido_pct)}
            </div>
            <p className="text-xs text-muted-foreground">
              {enPlazo} de {m.servicios_completados} entregados a tiempo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" /> Invitaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{m.total_invitaciones}</p>
            <p className="text-xs text-muted-foreground">
              Tasa de respuesta:{" "}
              <strong>
                {m.tasa_respuesta_invitacion_pct === null
                  ? "—"
                  : `${m.tasa_respuesta_invitacion_pct}%`}
              </strong>{" "}
              ({m.invitaciones_respondidas} respondidas)
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Estas métricas son visibles para los administradores de 360Lateral para tomar
        decisiones de asignación.
      </p>
    </div>
  );
};

export default MiDesempenoPanel;
