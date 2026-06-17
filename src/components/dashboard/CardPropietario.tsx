import { Building2, AlertTriangle } from "lucide-react";
import type { PropietarioConActivos } from "@/hooks/usePropietariosConActivos";

interface Props {
  propietario: PropietarioConActivos;
  onClick: () => void;
}

export const CardPropietario = ({ propietario, onClick }: Props) => {
  const scoreColor =
    propietario.score_promedio != null
      ? propietario.score_promedio >= 8
        ? "text-green-700"
        : propietario.score_promedio >= 6
          ? "text-primary"
          : "text-amber-700"
      : "text-muted-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-secondary hover:bg-muted/30"
    >
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary/10">
          <Building2 className="h-4 w-4 text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {propietario.nombre}
          </p>
          {propietario.email && (
            <p className="truncate text-[10px] text-muted-foreground">
              {propietario.email}
            </p>
          )}
        </div>
        {propietario.engagements_atrasados > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
            <AlertTriangle className="h-2.5 w-2.5" />
            {propietario.engagements_atrasados}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/40 p-2">
        <div className="text-center">
          <p className="text-base font-bold text-foreground">
            {propietario.total_lotes}
          </p>
          <p className="text-[9px] uppercase text-muted-foreground">Lotes</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground">
            {propietario.lotes_con_engagement}
          </p>
          <p className="text-[9px] uppercase text-muted-foreground">En gestión</p>
        </div>
        <div className="relative text-center">
          <p className="text-base font-bold text-foreground">
            {propietario.total_leads}
          </p>
          <p className="text-[9px] uppercase text-muted-foreground">Leads</p>
          {propietario.leads_nuevos > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </div>
      </div>

      {propietario.score_promedio != null && (
        <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1">
          <span className="text-[10px] text-muted-foreground">
            Score promedio
          </span>
          <span className={`text-sm font-bold ${scoreColor}`}>
            {propietario.score_promedio.toFixed(1)}
          </span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Click para ver sus lotes →
      </p>
    </button>
  );
};

export default CardPropietario;
