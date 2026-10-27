import { CircleHelp, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatScore360, score360Tone } from "@/lib/score-360-display";

const description = "Score 360°: puntaje de 0 a 10 que resume la viabilidad del lote (jurídico, normativo y servicios).";
const tones = {
  missing: "bg-muted text-muted-foreground border-border",
  danger: "bg-danger text-destructive-foreground border-danger",
  warning: "bg-warning text-primary-foreground border-warning",
  success: "bg-success text-primary-foreground border-success",
};

export const Score360Badge = ({ score }: { score: number | null | undefined }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span tabIndex={0} title={description} aria-label={`${formatScore360(score)}. ${description}`} className="pointer-events-auto inline-flex max-w-full cursor-help rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Badge className={`gap-1 whitespace-nowrap text-xs ${tones[score360Tone(score)]}`}>
          <Star className="h-3 w-3" />
          {formatScore360(score)}
          <CircleHelp className="h-3.5 w-3.5" />
        </Badge>
      </span>
    </TooltipTrigger>
    <TooltipContent className="max-w-[min(280px,calc(100vw-32px))]">{description}</TooltipContent>
  </Tooltip>
);