import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getSectoresFrecuentes } from "@/lib/barriosFrecuentes";

interface Props {
  departamento: string;
  ciudad: string;
  value: string;
  onChange: (v: string) => void;
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function BarrioCombobox({ departamento, ciudad, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [registrados, setRegistrados] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRegistrados([]);
    if (!ciudad) return;
    let activo = true;
    (supabase.rpc as any)("listar_barrios_municipio", { _departamento: departamento || null, _ciudad: ciudad })
      .then(({ data }: { data: { barrio: string }[] | null }) => {
        if (activo && data) setRegistrados(data.map((d) => d.barrio).filter(Boolean));
      });
    return () => { activo = false; };
  }, [departamento, ciudad]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const opciones = useMemo(() => {
    const mapa = new Map<string, string>();
    [...getSectoresFrecuentes(ciudad), ...registrados].forEach((b) => { if (!mapa.has(norm(b))) mapa.set(norm(b), b); });
    return Array.from(mapa.values()).sort((a, b) => a.localeCompare(b, "es"));
  }, [ciudad, registrados]);

  const q = norm(value);
  const filtradas = q ? opciones.filter((o) => norm(o).includes(q)) : opciones;
  const exacta = opciones.some((o) => norm(o) === q);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Input
          value={value}
          disabled={!ciudad}
          placeholder={ciudad ? "Elige de la lista o escribe el nombre" : "Primero elige el municipio"}
          onFocus={() => setOpen(true)}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setOpen(false); }}
          className="pr-9"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={!ciudad}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-label="Ver barrios y veredas"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && ciudad && (filtradas.length > 0 || (value.trim() && !exacta)) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {value.trim() && !exacta && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
            >
              <Plus className="h-4 w-4 text-primary" /> Usar "{value.trim()}"
            </button>
          )}
          {filtradas.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" /> {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
