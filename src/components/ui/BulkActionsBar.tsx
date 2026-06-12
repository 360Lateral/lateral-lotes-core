import { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkActionsBarProps {
  count: number;
  itemLabel?: { singular: string; plural: string };
  onClear: () => void;
  children: ReactNode;
}

export const BulkActionsBar = ({
  count,
  itemLabel = { singular: "elemento seleccionado", plural: "elementos seleccionados" },
  onClear,
  children,
}: BulkActionsBarProps) => {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <Checkbox checked onCheckedChange={() => onClear()} />
        <span className="text-xs font-semibold text-foreground">
          {count} {count === 1 ? itemLabel.singular : itemLabel.plural}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
};

export default BulkActionsBar;
