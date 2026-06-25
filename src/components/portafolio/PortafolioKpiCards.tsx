import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KPIEstado, KPIFinanciero } from "@/components/ui/KPIEstado";
import { formatCOPCompact, formatUSD } from "@/lib/format-moneda";
import type { PortafolioKpis } from "@/hooks/usePortafolioKpis";

interface Props {
  kpis: PortafolioKpis | undefined;
  isLoading: boolean;
}

const PortafolioKpiCards = ({ kpis, isLoading }: Props) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full" />
        ))}
      </div>
    );
  }

  const slaColor =
    kpis.sla_vencidos > 0 ? "text-destructive" : "text-foreground";
  const avance = Number(kpis.avance_promedio_pct ?? 0);
  const conv = Number(kpis.conversion_gratuito_a_pago_pct ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KPIEstado
        label="Lotes activos"
        value={kpis.lotes_activos}
        icon={MapPin}
        iconColorClass="text-secondary"
      />
      <KPIEstado
        label="Avance promedio"
        value={`${avance.toFixed(1)}%`}
        icon={TrendingUp}
        iconColorClass="text-primary"
      />
      <KPIEstado
        label="SLA vencidos"
        value={kpis.sla_vencidos}
        icon={AlertTriangle}
        colorClass={slaColor}
        iconColorClass={slaColor}
        destacado={kpis.sla_vencidos > 0}
      />
      <KPIFinanciero
        label="Ingresos del mes"
        value={formatCOPCompact(kpis.ingresos_mes_cop)}
        icon={DollarSign}
        sublabel={`≈ ${formatUSD(kpis.ingresos_mes_usd ?? 0)}`}
      />
      <KPIFinanciero
        label="Ticket promedio"
        value={formatCOPCompact(kpis.ticket_promedio_cop)}
        icon={Receipt}
      />
      <KPIEstado
        label="Conversión Gratuito→Pago"
        value={`${conv.toFixed(1)}%`}
        icon={ArrowUpRight}
        iconColorClass="text-warning"
        sublabel="Últimos 30 días"
      />
    </div>
  );
};

export default PortafolioKpiCards;
