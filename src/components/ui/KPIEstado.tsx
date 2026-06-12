import { type LucideIcon } from "lucide-react";

interface KPIEstadoProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  iconColorClass?: string;
  destacado?: boolean;
  onClick?: () => void;
  sublabel?: string;
}

export const KPIEstado = ({
  label,
  value,
  icon: Icon,
  colorClass = "text-foreground",
  iconColorClass,
  destacado,
  onClick,
  sublabel,
}: KPIEstadoProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`text-left rounded-md p-2.5 transition-colors ${
      destacado
        ? "border border-primary bg-primary/10 hover:bg-primary/15"
        : "border border-border bg-background hover:bg-muted/30"
    } ${onClick ? "cursor-pointer" : "cursor-default"}`}
  >
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 flex items-center justify-between gap-2">
      <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
      <Icon className={`h-4 w-4 ${iconColorClass ?? colorClass}`} />
    </div>
    {sublabel && (
      <div className="mt-0.5 text-[10px] text-muted-foreground">{sublabel}</div>
    )}
  </button>
);

interface KPIFinancieroProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number | null;
  deltaPositive?: boolean;
  invertirColorDelta?: boolean;
  sublabel?: string;
}

export const KPIFinanciero = ({
  label,
  value,
  icon: Icon,
  delta,
  deltaPositive,
  invertirColorDelta,
  sublabel,
}: KPIFinancieroProps) => {
  const positive = invertirColorDelta ? !deltaPositive : deltaPositive;
  const deltaColor =
    delta == null
      ? "text-muted-foreground"
      : positive
      ? "text-green-600"
      : "text-destructive";
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-1 text-xl font-bold text-foreground truncate">{value}</div>
          {delta != null && (
            <div className={`mt-0.5 text-[10px] font-medium ${deltaColor}`}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}% vs anterior
            </div>
          )}
          {sublabel && !delta && (
            <div className="mt-0.5 text-[10px] text-muted-foreground">{sublabel}</div>
          )}
        </div>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
};

export default KPIEstado;
