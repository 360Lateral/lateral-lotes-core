import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SCORE_CONFIG: Record<
  number,
  { dotClass: string; textClass: string; text: string }
> = {
  1: { dotClass: "bg-success", textClass: "text-success", text: "Favorable" },
  2: { dotClass: "bg-warning", textClass: "text-warning", text: "Requiere revisión" },
  3: { dotClass: "bg-destructive", textClass: "text-destructive", text: "Tiene observaciones" },
};

const NULL_CONFIG = {
  dotClass: "bg-muted-foreground",
  textClass: "text-muted-foreground",
  text: "Sin información aún",
};

interface ScoreIndicatorProps {
  score: number | null;
  label: string;
  emoji: string;
  size?: "sm" | "lg";
}

const ScoreIndicator = ({ score, label, emoji, size = "sm" }: ScoreIndicatorProps) => {
  const config = score != null && SCORE_CONFIG[score] ? SCORE_CONFIG[score] : NULL_CONFIG;
  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-4 w-4";

  const content = (
    <div className={`flex items-center gap-1.5 ${size === "lg" ? "gap-2" : ""}`}>
      <span className="text-xs">{emoji}</span>
      <span className={`shrink-0 rounded-full ${dotSize} ${config.dotClass}`} />
      <div className={size === "lg" ? "flex flex-col" : ""}>
        <span className={`font-body ${size === "sm" ? "text-[10px]" : "text-xs font-semibold"} text-muted-foreground`}>
          {label}
        </span>
        {size === "lg" && (
          <span className={`font-body text-xs ${config.textClass}`}>
            {config.text}
          </span>
        )}
      </div>
    </div>
  );

  if (size === "sm") {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{config.text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default ScoreIndicator;
