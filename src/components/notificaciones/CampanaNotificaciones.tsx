import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useContadorNotificaciones } from "@/hooks/useContadorNotificaciones";
import PanelNotificaciones from "./PanelNotificaciones";

const CampanaNotificaciones = () => {
  const [open, setOpen] = useState(false);
  const { count } = useContadorNotificaciones();

  const label =
    count >= 100 ? "99+" : count > 9 ? "9+" : count > 0 ? String(count) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/50"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 font-body text-[10px] font-bold leading-none text-destructive-foreground">
              {label}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[90vw] max-w-[360px] p-3"
      >
        <PanelNotificaciones onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default CampanaNotificaciones;
