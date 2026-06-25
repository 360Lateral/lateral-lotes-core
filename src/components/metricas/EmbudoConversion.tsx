import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmbudoFila } from "@/hooks/useEmbudoConversion";
import { cn } from "@/lib/utils";
import { formatNumero } from "@/lib/format-moneda";

interface Props {
  data: EmbudoFila[];
  isLoading: boolean;
}

const bgByIndex = [
  "bg-primary/10",
  "bg-primary/20",
  "bg-primary/35",
  "bg-primary/50",
  "bg-primary/65",
];

const EmbudoConversion = ({ data, isLoading }: Props) => {
  const maxCantidad = Math.max(...data.map((d) => d.cantidad ?? 0), 1);
  const todosCero = data.every((d) => (d.cantidad ?? 0) === 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-body text-base">Embudo de conversión</CardTitle>
        <p className="font-body text-xs text-muted-foreground">
          De lead a engagement entregado
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : todosCero ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">
            Aún no hay datos suficientes para calcular el embudo
          </p>
        ) : (
          <div className="space-y-1">
            {data.map((etapa, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === data.length - 1;
              const ratio = (etapa.cantidad ?? 0) / maxCantidad;
              const widthPct = Math.max(ratio * 100, 10);
              const isEmpty = (etapa.cantidad ?? 0) === 0;
              const bg = isEmpty ? "bg-muted" : bgByIndex[idx] ?? "bg-primary/60";
              const radius = cn(
                isFirst && "rounded-t-md",
                isLast && "rounded-b-md"
              );
              return (
                <div key={etapa.etapa}>
                  <div
                    className={cn(
                      "mx-auto flex items-center justify-between px-4 py-3 transition-all",
                      bg,
                      radius
                    )}
                    style={{ width: `${widthPct}%`, minHeight: 60 }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-body text-xs font-medium text-foreground">
                        {etapa.etapa}
                      </p>
                      <p className="font-body text-xl font-bold text-foreground">
                        {formatNumero(etapa.cantidad ?? 0)}
                      </p>
                    </div>
                    {!isFirst && etapa.conversion_pct != null && (
                      <span className="ml-2 shrink-0 font-body text-xs font-semibold text-foreground/80">
                        {Number(etapa.conversion_pct).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {!isLast && (
                    <div className="flex justify-center py-1">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmbudoConversion;
