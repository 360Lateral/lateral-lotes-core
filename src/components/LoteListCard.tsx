import { Badge } from "@/components/ui/badge";
import ScoreIndicator from "@/components/ScoreIndicator";
import { Sparkles } from "lucide-react";
import type { LoteWithPrecio } from "@/pages/Lotes";

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const estadoVariant = (e: string) => {
  switch (e) {
    case "Disponible": return "disponible" as const;
    case "Reservado": return "reservado" as const;
    case "Vendido": return "vendido" as const;
    default: return "default" as const;
  }
};

const esReciente = (createdAt: string | null): boolean => {
  if (!createdAt) return false;
  const dias = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return dias <= 7;
};

interface Props {
  lote: LoteWithPrecio;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

const LoteListCard = ({ lote, onMouseEnter, onMouseLeave, onClick }: Props) => (
  <div
    className="cursor-pointer rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="truncate font-body text-sm font-semibold text-foreground">
            {lote.nombre_lote}
          </p>
          {esReciente(lote.created_at) && (
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[9px] px-1.5 py-0 h-4 gap-0.5">
              <Sparkles className="h-2.5 w-2.5" /> Nuevo
            </Badge>
          )}
        </div>
        <p className="font-body text-xs text-muted-foreground">
          {lote.barrio}{lote.ciudad ? `, ${lote.ciudad}` : ""}
        </p>
      </div>
      <Badge variant={estadoVariant(lote.estado_disponibilidad)} className="shrink-0">
        {lote.estado_disponibilidad}
      </Badge>
    </div>

    <div className="mt-2 flex items-end justify-between">
      <span className="font-body text-xs text-muted-foreground">
        {(lote.area_total_m2 ?? 0).toLocaleString("es-CO")} m²
      </span>
      <span className="font-body text-sm font-semibold text-primary">
        {formatCOP(lote.precio_m2)}/m²
      </span>
    </div>

    <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
      <ScoreIndicator score={lote.score_juridico ?? null} label="Jurídico" emoji="⚖️" size="sm" />
      <ScoreIndicator score={lote.score_normativo ?? null} label="Normativo" emoji="📋" size="sm" />
      <ScoreIndicator score={lote.score_servicios ?? null} label="Servicios" emoji="🔌" size="sm" />
    </div>
  </div>
);

export default LoteListCard;
