import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaInverso?: boolean;
  deltaSufijo?: string;
  icon: LucideIcon;
  descripcion?: string;
  loading?: boolean;
}

export const KPICard = ({
  label,
  value,
  delta,
  deltaInverso,
  deltaSufijo,
  icon: Icon,
  descripcion,
  loading,
}: KPICardProps) => {
  if (loading) return <Skeleton className="h-32 w-full" />;
  const deltaPositivo = delta != null && (deltaInverso ? delta < 0 : delta > 0);
  const deltaNegativo = delta != null && (deltaInverso ? delta > 0 : delta < 0);
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="font-display text-2xl md:text-3xl font-bold mb-1 truncate">{value}</p>
      {delta != null && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-xs",
            deltaPositivo && "text-emerald-600",
            deltaNegativo && "text-red-600",
            delta === 0 && "text-muted-foreground",
          )}
        >
          {delta > 0 ? <ArrowUp className="h-3 w-3" /> : delta < 0 ? <ArrowDown className="h-3 w-3" /> : null}
          <span>
            {Math.abs(delta)}
            {deltaSufijo ?? ""} vs período anterior
          </span>
        </div>
      )}
      {descripcion && <p className="text-[10px] text-muted-foreground mt-1">{descripcion}</p>}
    </Card>
  );
};

export default KPICard;
