import { LucideIcon, Scale, Leaf, Building, Coins, Mountain, TrendingUp, Wrench, Lock } from "lucide-react";

interface ScoreItem {
  key: string;
  icon: LucideIcon;
  label: string;
  score: number | null | undefined;
  bloqueado?: boolean;
}

const colorByScore = (score: number | null | undefined) => {
  if (score == null) return { bg: "bg-muted/40", border: "border-muted", text: "text-muted-foreground" };
  if (score >= 8) return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" };
  if (score >= 6) return { bg: "bg-primary/10", border: "border-primary/25", text: "text-primary" };
  return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" };
};

export interface Score360Props {
  scoreJuridico?: number | null;
  scoreAmbiental?: number | null;
  scoreArquitectonico?: number | null;
  scoreFinanciero?: number | null;
  scoreGeotecnico?: number | null;
  scoreMercado?: number | null;
  scoreSspp?: number | null;
  bloqueado?: boolean;
}

export const Score360Visualizacion = (props: Score360Props) => {
  const items: ScoreItem[] = [
    { key: "juridico", icon: Scale, label: "Jurídico", score: props.scoreJuridico, bloqueado: props.bloqueado },
    { key: "ambiental", icon: Leaf, label: "Ambiental", score: props.scoreAmbiental, bloqueado: props.bloqueado },
    { key: "arquitectonico", icon: Building, label: "Arquitec.", score: props.scoreArquitectonico, bloqueado: props.bloqueado },
    { key: "financiero", icon: Coins, label: "Financiero", score: props.scoreFinanciero, bloqueado: props.bloqueado },
    { key: "geotecnico", icon: Mountain, label: "Geotécnico", score: props.scoreGeotecnico, bloqueado: props.bloqueado },
    { key: "mercado", icon: TrendingUp, label: "Mercado", score: props.scoreMercado, bloqueado: props.bloqueado },
    { key: "sspp", icon: Wrench, label: "Servicios", score: props.scoreSspp, bloqueado: props.bloqueado },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const { bg, border, text } = item.bloqueado ? colorByScore(null) : colorByScore(item.score);
        return (
          <div
            key={item.key}
            className={`rounded-lg border ${border} ${bg} p-3 flex flex-col items-center text-center gap-1`}
          >
            {item.bloqueado ? (
              <Lock className={`h-5 w-5 ${text}`} />
            ) : (
              <Icon className={`h-5 w-5 ${text}`} />
            )}
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              {item.label}
            </span>
            <span className={`text-lg font-bold ${text}`}>
              {item.bloqueado ? "NDA" : item.score != null ? item.score.toFixed(1) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Score360Visualizacion;
