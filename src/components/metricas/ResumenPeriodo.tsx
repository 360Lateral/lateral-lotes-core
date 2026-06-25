import { Card, CardContent } from "@/components/ui/card";
import type { TendenciaMensualFila } from "@/hooks/useTendenciaMensual";
import { formatCOP, formatNumero } from "@/lib/format-moneda";

interface Props {
  data: TendenciaMensualFila[];
  mesesAtras: number;
}

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <p className="font-body text-xs text-muted-foreground">{label}</p>
    <p className="font-body text-xl font-bold text-foreground">{value}</p>
  </div>
);

const ResumenPeriodo = ({ data, mesesAtras }: Props) => {
  const totalCreados = data.reduce((s, r) => s + (r.engagements_creados ?? 0), 0);
  const totalCompletados = data.reduce((s, r) => s + (r.engagements_completados ?? 0), 0);
  const totalIngresos = data.reduce((s, r) => s + (r.ingresos_cop ?? 0), 0);
  const ticket = totalCreados > 0 ? totalIngresos / totalCreados : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-3 font-body text-xs uppercase tracking-wide text-muted-foreground">
          Resumen últimos {mesesAtras} meses
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Mini label="Engagements creados" value={formatNumero(totalCreados)} />
          <Mini label="Engagements completados" value={formatNumero(totalCompletados)} />
          <Mini label="Ingresos totales" value={formatCOP(totalIngresos)} />
          <Mini label="Ticket promedio" value={formatCOP(Math.round(ticket))} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumenPeriodo;
