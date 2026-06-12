import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

interface MetricaOverviewProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  sublabel?: string;
}

export const MetricaOverview = ({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  sublabel,
}: MetricaOverviewProps) => (
  <Card>
    <CardContent className="p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium truncate">
          {label}
        </p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {deltaLabel && (
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${
              delta && delta > 0
                ? "text-emerald-600"
                : delta && delta < 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {delta !== undefined && delta > 0 && <TrendingUp className="h-3 w-3" />}
            {delta !== undefined && delta < 0 && <TrendingDown className="h-3 w-3" />}
            {deltaLabel}
          </p>
        )}
        {sublabel && !deltaLabel && (
          <p className="text-xs mt-1 text-muted-foreground">{sublabel}</p>
        )}
      </div>
      <div className="h-9 w-9 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
    </CardContent>
  </Card>
);

export default MetricaOverview;
