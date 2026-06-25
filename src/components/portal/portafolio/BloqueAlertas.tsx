import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AlertaPortafolio } from "@/hooks/portal/usePortafolioPropietario";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  Sparkles,
  TrendingUp,
  AlertCircle,
};

interface Props {
  alertas: AlertaPortafolio[];
}

export const BloqueAlertas = ({ alertas }: Props) => (
  <section>
    <h3 className="font-semibold mb-3">Alertas y oportunidades</h3>
    <div className="space-y-2">
      {alertas.map((a) => {
        const Icon = ICONS[a.icon] ?? AlertCircle;
        return (
          <Card key={a.tipo} className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {a.count} lote{a.count === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to={a.cta}>{a.cta_label}</Link>
            </Button>
          </Card>
        );
      })}
    </div>
  </section>
);
