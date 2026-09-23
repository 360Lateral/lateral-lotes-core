import { ReactNode } from "react";
import { Check, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const WizardSection = ({
  title,
  description,
  icon: Icon,
  children,
  aside,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  aside?: ReactNode;
}) => (
  <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
    <header className="mb-5 flex items-start gap-3 border-b border-border pb-4">
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1">
        <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 font-body text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {aside}
    </header>
    <div className="flex flex-col gap-4">{children}</div>
  </section>
);

export const ChoiceSegment = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div role="radiogroup" className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-1 sm:w-auto">
    {options.map((o) => {
      const active = value === o.value;
      return (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-4 py-2 font-body text-sm font-medium transition-all sm:flex-none",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export const ServiceTile = ({
  label,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    className={cn(
      "relative flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 font-body text-xs font-medium transition-all",
      active
        ? "border-secondary bg-secondary/10 text-foreground"
        : "border-border bg-card text-muted-foreground hover:border-primary/40",
    )}
  >
    {active && (
      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Check className="h-3 w-3" />
      </span>
    )}
    <Icon className={cn("h-5 w-5", active ? "text-secondary" : "")} />
    {label}
  </button>
);

export const FieldLabel = ({ children, required }: { children: ReactNode; required?: boolean }) => (
  <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
    {required && <span className="ml-0.5 text-secondary">*</span>}
  </label>
);
