import { Building2, TrendingUp, Coins, Percent, Sparkles } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCOPCompact, formatPorcentaje } from "@/lib/format-moneda";
import type { PortafolioPropietarioData } from "@/hooks/portal/usePortafolioPropietario";

interface Props {
  kpis: PortafolioPropietarioData["kpis"];
}

export const BloqueHeroEjecutivo = ({ kpis }: Props) => (
  <section>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <KPICard
        label="Activos"
        value={kpis.total_lotes}
        icon={Building2}
        descripcion={`${kpis.ciudades_distintas} ciudad${kpis.ciudades_distintas === 1 ? "" : "es"}`}
      />
      <KPICard
        label="Avalúo total"
        value={formatCOPCompact(kpis.valor_avaluo_total)}
        icon={Coins}
      />
      <KPICard
        label="VPN proyectado"
        value={formatCOPCompact(kpis.vpn_total_proyectado)}
        icon={TrendingUp}
        descripcion={`${kpis.lotes_con_vpn} de ${kpis.total_lotes} lotes`}
      />
      <KPICard
        label="TIR ponderada"
        value={formatPorcentaje(kpis.tir_promedio_ponderada)}
        icon={Percent}
      />
      <KPICard
        label="Score portafolio"
        value={`${kpis.score_portafolio.toFixed(1)}/10`}
        icon={Sparkles}
        descripcion={`${kpis.analisis_completos_pct.toFixed(0)}% análisis completos`}
      />
    </div>
  </section>
);
