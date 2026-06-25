import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { TendenciaMensualFila } from "@/hooks/useTendenciaMensual";
import { formatCOP, formatNumero } from "@/lib/format-moneda";

interface Props {
  data: TendenciaMensualFila[];
}

const Delta = ({ actual, anterior }: { actual: number; anterior: number }) => {
  if (anterior === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground">
        <ArrowRight className="h-3 w-3" />—
      </span>
    );
  }
  const pct = ((actual - anterior) / anterior) * 100;
  const subio = pct > 0.5;
  const bajo = pct < -0.5;
  const Icon = subio ? ArrowUp : bajo ? ArrowDown : ArrowRight;
  const cls = subio
    ? "bg-success/15 text-success"
    : bajo
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-body text-xs font-semibold ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

interface CardProps {
  titulo: string;
  valor: string;
  actual: number;
  anterior: number;
  subtituloAnterior: string;
  formato: (n: number) => string;
}

const CompCard = ({ titulo, valor, actual, anterior, subtituloAnterior, formato }: CardProps) => (
  <Card>
    <CardContent className="p-4">
      <p className="font-body text-xs text-muted-foreground">{titulo}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-body text-2xl font-bold text-foreground">{valor}</p>
        <Delta actual={actual} anterior={anterior} />
      </div>
      <p className="mt-1 font-body text-xs text-muted-foreground">
        {subtituloAnterior}: {formato(anterior)}
      </p>
    </CardContent>
  </Card>
);

const CardsComparativas = ({ data }: Props) => {
  // Mes actual = última fila; mes anterior = penúltima
  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const engActual = last?.engagements_creados ?? 0;
  const engPrev = prev?.engagements_creados ?? 0;
  const ingActual = last?.ingresos_cop ?? 0;
  const ingPrev = prev?.ingresos_cop ?? 0;

  // YTD vs mismo periodo año anterior
  const now = new Date();
  const yearNow = now.getFullYear();
  const monthNow = now.getMonth(); // 0-indexed

  const ytdActual = data.filter((d) => {
    const dt = new Date(d.mes);
    return dt.getFullYear() === yearNow && dt.getMonth() <= monthNow;
  });
  const ytdAnterior = data.filter((d) => {
    const dt = new Date(d.mes);
    return dt.getFullYear() === yearNow - 1 && dt.getMonth() <= monthNow;
  });

  const engYtdAct = ytdActual.reduce((s, r) => s + (r.engagements_creados ?? 0), 0);
  const engYtdAnt = ytdAnterior.reduce((s, r) => s + (r.engagements_creados ?? 0), 0);
  const ingYtdAct = ytdActual.reduce((s, r) => s + (r.ingresos_cop ?? 0), 0);
  const ingYtdAnt = ytdAnterior.reduce((s, r) => s + (r.ingresos_cop ?? 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CompCard
        titulo="Engagements este mes"
        valor={formatNumero(engActual)}
        actual={engActual}
        anterior={engPrev}
        subtituloAnterior="vs mes anterior"
        formato={formatNum}
      />
      <CompCard
        titulo="Ingresos este mes"
        valor={formatCOP(ingActual)}
        actual={ingActual}
        anterior={ingPrev}
        subtituloAnterior="vs mes anterior"
        formato={formatCop}
      />
      <CompCard
        titulo="Engagements año en curso (YTD)"
        valor={formatNumero(engYtdAct)}
        actual={engYtdAct}
        anterior={engYtdAnt}
        subtituloAnterior="vs mismo periodo año anterior"
        formato={formatNum}
      />
      <CompCard
        titulo="Ingresos año en curso (YTD)"
        valor={formatCOP(ingYtdAct)}
        actual={ingYtdAct}
        anterior={ingYtdAnt}
        subtituloAnterior="vs mismo periodo año anterior"
        formato={formatCop}
      />
    </div>
  );
};

export default CardsComparativas;
