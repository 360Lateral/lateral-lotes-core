import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Nuevo nombre */
  titulo?: string;
  /** Compat: alias de titulo */
  title?: string;
  /** Nuevo nombre */
  descripcion?: string;
  /** Compat: alias de descripcion */
  description?: string;
  /** Botón CTA */
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaTo?: string;
  ctaVariant?: "default" | "outline" | "hero";
  /** Compat: nodo de acción libre */
  action?: ReactNode;
  /** Tamaño visual: 'sm' para uso dentro de cards/secciones, 'md' (default) para página completa */
  size?: "sm" | "md";
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  titulo,
  title,
  descripcion,
  description,
  ctaLabel,
  onCtaClick,
  ctaTo,
  ctaVariant = "outline",
  action,
  size = "md",
  className,
}: EmptyStateProps) => {
  const isSmall = size === "sm";
  const tituloFinal = titulo ?? title ?? "";
  const descripcionFinal = descripcion ?? description;

  return (
    <Card
      className={cn(
        "border-dashed flex flex-col items-center justify-center text-center",
        isSmall ? "p-6 gap-2" : "p-10 gap-3",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full bg-muted flex items-center justify-center",
            isSmall ? "h-10 w-10 mb-1" : "h-14 w-14 mb-2",
          )}
        >
          <Icon
            className={cn(
              "text-muted-foreground",
              isSmall ? "h-5 w-5" : "h-7 w-7",
            )}
          />
        </div>
      )}

      <p
        className={cn(
          "font-medium text-foreground",
          isSmall ? "text-sm" : "text-base",
        )}
      >
        {tituloFinal}
      </p>

      {descripcionFinal && (
        <p
          className={cn(
            "text-muted-foreground max-w-md",
            isSmall ? "text-xs" : "text-sm",
          )}
        >
          {descripcionFinal}
        </p>
      )}

      {ctaLabel && (
        <div className="mt-2">
          {ctaTo ? (
            <Button asChild variant={ctaVariant} size={isSmall ? "sm" : "default"}>
              <Link to={ctaTo}>{ctaLabel}</Link>
            </Button>
          ) : (
            <Button
              variant={ctaVariant}
              size={isSmall ? "sm" : "default"}
              onClick={onCtaClick}
            >
              {ctaLabel}
            </Button>
          )}
        </div>
      )}

      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
};

export default EmptyState;
