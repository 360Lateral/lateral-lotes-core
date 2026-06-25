import {
  Activity,
  Scale,
  FileText,
  Leaf,
  Plug,
  Mountain,
  TrendingUp,
  Building2,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AreaSaludPortafolio } from "@/hooks/portal/usePortafolioPropietario";

const ICON_MAP: Record<string, LucideIcon> = {
  juridico: Scale,
  normativo: FileText,
  ambiental: Leaf,
  sspp: Plug,
  geotecnico: Mountain,
  mercado: TrendingUp,
  arquitectonico: Building2,
  financiero: Coins,
};

interface Props {
  areas: AreaSaludPortafolio[];
}

export const BloqueSaludAreas = ({ areas }: Props) => (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <Activity className="h-4 w-4 text-primary" />
      <h3 className="font-semibold">Salud técnica del portafolio</h3>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {areas.map((area) => {
        const Icon = ICON_MAP[area.codigo] ?? FileText;
        const nivel =
          area.promedio >= 7 ? "ok" : area.promedio >= 4 ? "warning" : "critical";
        const styles = {
          ok: "bg-emerald-50 border-emerald-200 text-emerald-700",
          warning: "bg-amber-50 border-amber-200 text-amber-700",
          critical: "bg-red-50 border-red-200 text-red-700",
        }[nivel];

        return (
          <Card key={area.codigo} className={cn("p-3 border", styles)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4" />
              <p className="text-xs font-medium">{area.nombre}</p>
            </div>
            <p className="font-display text-2xl font-bold">
              {area.promedio.toFixed(1)}
              <span className="text-xs font-normal opacity-70">/10</span>
            </p>
            {area.criticos > 0 && (
              <p className="text-[11px] mt-1">⚠ {area.criticos} con problema</p>
            )}
            {area.warnings > 0 && (
              <p className="text-[11px] opacity-80">{area.warnings} en revisión</p>
            )}
          </Card>
        );
      })}
    </div>
  </section>
);
