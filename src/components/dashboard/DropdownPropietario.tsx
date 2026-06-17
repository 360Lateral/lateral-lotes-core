import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Building2, Check, ChevronDown, Users, X } from "lucide-react";
import { usePropietariosConActivos } from "@/hooks/usePropietariosConActivos";

interface Props {
  propietarioId: string | null;
  onChange: (id: string | null) => void;
}

export const DropdownPropietario = ({ propietarioId, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const { data: propietarios = [], isLoading } = usePropietariosConActivos();

  const seleccionado = propietarioId
    ? propietarios.find((p) => p.id === propietarioId)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors ${
            seleccionado
              ? "border-secondary bg-secondary text-white"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span className="max-w-[160px] truncate">
            {seleccionado ? seleccionado.nombre : "Todos los propietarios"}
          </span>
          {seleccionado && (
            <span className="rounded-full bg-white/20 px-1.5 text-[9px] font-bold">
              {seleccionado.total_lotes}
            </span>
          )}
          {seleccionado ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange(null);
                }
              }}
              className="ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full hover:bg-background/30"
              aria-label="Quitar filtro de propietario"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          ) : (
            <ChevronDown className="h-3 w-3 opacity-60" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar propietario..." className="text-xs" />
          <CommandList>
            <CommandEmpty className="py-4 text-xs">
              {isLoading ? "Cargando..." : "No hay propietarios."}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__todos__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="text-xs"
              >
                <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1">Todos los propietarios</span>
                {!propietarioId && <Check className="h-3.5 w-3.5" />}
              </CommandItem>
              {propietarios.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.nombre} ${p.email ?? ""}`}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Building2 className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {p.nombre}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {p.total_lotes} lotes · {p.lotes_con_engagement} en gestión
                      {p.engagements_atrasados > 0 && (
                        <span className="text-destructive">
                          {" "}
                          · {p.engagements_atrasados} atrasados
                        </span>
                      )}
                    </p>
                  </div>
                  {propietarioId === p.id && (
                    <Check className="ml-2 h-3.5 w-3.5 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DropdownPropietario;
