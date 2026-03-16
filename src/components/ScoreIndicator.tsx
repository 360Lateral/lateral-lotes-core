import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SCORE_CONFIG: Record<number, { color: string; text: string }> = {
  1: { color: "#2ecc71", text: "Favorable" },
  2: { color: "#f39c12", text: "Requiere revisión" },
  3: { color: "#e74c3c", text: "Tiene observaciones" },
};

const NULL_CONFIG = { color: "#9ca3af", text: "Sin información aún" };

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
      <span
        className={`shrink-0 rounded-full ${dotSize}`}
        style={{ backgroundColor: config.color }}
      />
      <div className={size === "lg" ? "flex flex-col" : ""}>
        <span className={`font-body ${size === "sm" ? "text-[10px]" : "text-xs font-semibold"} text-muted-foreground`}>
          {label}
        </span>
        {size === "lg" && (
          <span
            className="font-body text-xs"
            style={{ color: config.color }}
          >
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
