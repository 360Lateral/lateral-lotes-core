import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, TrendingUp, Info } from "lucide-react";
import {
  formatCOP,
  formatCOPCompact,
  formatMetros,
  formatNumero,
  formatPorcentaje,
} from "@/lib/format-moneda";
import type { PortafolioPropietarioData } from "@/hooks/portal/usePortafolioPropietario";

interface Props {
  lentes: PortafolioPropietarioData["lentes"];
  kpis: PortafolioPropietarioData["kpis"];
}

const FilaDato = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-2 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right">{value}</span>
  </div>
);

export const BloqueDobleLente = ({ lentes, kpis }: Props) => {
  const lotesSinVpn = kpis.total_lotes - kpis.lotes_con_vpn;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Lente avalúo */}
      <Card className="border-emerald-200/60">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <Coins className="h-5 w-5" />
            <h3 className="font-semibold">Tu portafolio HOY</h3>
          </div>
          <p className="text-xs text-muted-foreground">Valor de mercado estimado</p>
          <p className="font-display text-3xl md:text-4xl font-bold text-emerald-700">
            {formatCOPCompact(lentes.avaluo.valor_total)}
          </p>
          <div className="pt-2 space-y-0">
            <FilaDato
              label="Valor por m² promedio"
              value={`${formatCOP(lentes.avaluo.valor_m2_promedio)}/m²`}
            />
            {lentes.avaluo.lote_mas_valioso && (
              <FilaDato
                label="Lote más valioso"
                value={
                  <Link
                    to={`/lotes/${lentes.avaluo.lote_mas_valioso.id}`}
                    className="hover:text-primary underline-offset-2 hover:underline"
                  >
                    {lentes.avaluo.lote_mas_valioso.nombre_lote} ·{" "}
                    {formatCOPCompact(lentes.avaluo.lote_mas_valioso.avaluo)}
                  </Link>
                }
              />
            )}
            {lentes.avaluo.plusvalia_pct != null && (
              <FilaDato
                label={`Plusvalía vs compra${
                  lentes.avaluo.anios_tenencia != null
                    ? ` (${lentes.avaluo.anios_tenencia} años)`
                    : ""
                }`}
                value={
                  <span
                    className={
                      lentes.avaluo.plusvalia_pct >= 0
                        ? "text-emerald-700"
                        : "text-red-700"
                    }
                  >
                    {lentes.avaluo.plusvalia_pct >= 0 ? "+" : ""}
                    {formatPorcentaje(lentes.avaluo.plusvalia_pct)}
                  </span>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lente desarrollo */}
      <Card className="border-primary/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold">Si decides DESARROLLAR</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Potencial si construyes en tu portafolio
          </p>
          <p className="font-display text-3xl md:text-4xl font-bold text-primary">
            {formatCOPCompact(lentes.desarrollo.vpn_total)}
          </p>
          <div className="pt-2 space-y-0">
            <FilaDato
              label="Unidades estimadas totales"
              value={formatNumero(lentes.desarrollo.unidades_totales)}
            />
            <FilaDato
              label="Área construible total"
              value={formatMetros(lentes.desarrollo.area_construible_total)}
            />
            <FilaDato
              label="TIR promedio ponderada"
              value={formatPorcentaje(kpis.tir_promedio_ponderada)}
            />
          </div>

          {lotesSinVpn > 0 && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
              <p className="flex items-start gap-1.5 text-amber-900">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Basado en <strong>{kpis.lotes_con_vpn}</strong> de{" "}
                  <strong>{kpis.total_lotes}</strong> lotes con análisis Premium.
                </span>
              </p>
              <p className="mt-1 text-amber-800/80">
                Los {lotesSinVpn} restantes requieren plan Premium para proyección
                financiera.{" "}
                <Link
                  to="/planes"
                  className="font-medium underline underline-offset-2"
                >
                  Completar análisis →
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
