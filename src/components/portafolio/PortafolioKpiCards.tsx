import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import type { PortafolioKpis } from "@/hooks/usePortafolioKpis";

interface Props {
  kpis: PortafolioKpis | undefined;
  isLoading: boolean;
}

const formatCop = (n: number) =>
  `$ ${(n ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })} COP`;

const formatUsd = (n: number) =>
  `USD $${(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const KpiCard = ({
  label,
  value,
  Icon,
  colorClass,
  sub,
  progress,
}: {
  label: string;
  value: React.ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  sub?: React.ReactNode;
  progress?: number;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <p className="font-body text-xs text-muted-foreground">{label}</p>
        <Icon className={`h-5 w-5 shrink-0 ${colorClass}`} />
      </div>
      <p className="mt-2 font-body text-2xl font-bold text-foreground">{value}</p>
      {typeof progress === "number" && (
        <Progress value={progress} className="mt-2 h-1.5" />
      )}
      {sub && <p className="mt-1 font-body text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

const PortafolioKpiCards = ({ kpis, isLoading }: Props) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const slaColor = kpis.sla_vencidos > 0 ? "text-destructive" : "text-success";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <KpiCard
        label="Lotes activos"
        value={kpis.lotes_activos}
        Icon={MapPin}
        colorClass="text-secondary"
      />
      <KpiCard
        label="Avance promedio"
        value={`${Number(kpis.avance_promedio_pct ?? 0).toFixed(1)}%`}
        Icon={TrendingUp}
        colorClass="text-primary"
        progress={Number(kpis.avance_promedio_pct ?? 0)}
      />
      <KpiCard
        label="SLA vencidos"
        value={kpis.sla_vencidos}
        Icon={AlertTriangle}
        colorClass={slaColor}
      />
      <KpiCard
        label="Ingresos del mes"
        value={formatCop(kpis.ingresos_mes_cop)}
        Icon={DollarSign}
        colorClass="text-success"
        sub={`≈ ${formatUsd(kpis.ingresos_mes_usd)}`}
      />
      <KpiCard
        label="Ticket promedio"
        value={formatCop(kpis.ticket_promedio_cop)}
        Icon={Receipt}
        colorClass="text-secondary"
      />
      <KpiCard
        label="Conversión Gratuito → Pago"
        value={`${Number(kpis.conversion_gratuito_a_pago_pct ?? 0).toFixed(1)}%`}
        Icon={ArrowUpRight}
        colorClass="text-warning"
        sub="Últimos 30 días"
      />
    </div>
  );
};

export default PortafolioKpiCards;
