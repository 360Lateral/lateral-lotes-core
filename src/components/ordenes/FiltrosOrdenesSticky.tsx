import { Checkbox } from "@/components/ui/checkbox";

export interface FiltrosOrdenes {
  tipos: string[]; // tipo.nombre values
  visibilidad: "todas" | "publica" | "invitacion";
  diasMaximo: number;
  precioMinimo: number;
}

export const defaultFiltrosOrdenes: FiltrosOrdenes = {
  tipos: [],
  visibilidad: "todas",
  diasMaximo: 30,
  precioMinimo: 0,
};

interface Props {
  filtros: FiltrosOrdenes;
  onChange: (f: FiltrosOrdenes) => void;
  tiposDisponibles: { id: string; nombre: string; count: number }[];
}

export const contarFiltrosActivos = (f: FiltrosOrdenes) =>
  f.tipos.length +
  (f.visibilidad !== "todas" ? 1 : 0) +
  (f.diasMaximo < 30 ? 1 : 0) +
  (f.precioMinimo > 0 ? 1 : 0);

export const FiltrosOrdenesSticky = ({ filtros, onChange, tiposDisponibles }: Props) => (
  <aside className="lg:sticky lg:top-4 lg:self-start">
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => onChange(defaultFiltrosOrdenes)}
        >
          Limpiar
        </button>
      </div>

      {tiposDisponibles.length > 0 && (
        <div className="mb-3">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de análisis
          </label>
          <div className="space-y-1">
            {tiposDisponibles.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <Checkbox
                  checked={filtros.tipos.includes(t.id)}
                  onCheckedChange={(checked) => {
                    if (checked) onChange({ ...filtros, tipos: [...filtros.tipos, t.id] });
                    else onChange({ ...filtros, tipos: filtros.tipos.filter((x) => x !== t.id) });
                  }}
                />
                <span className="flex-1">{t.nombre}</span>
                <span className="text-muted-foreground">({t.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Visibilidad
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "todas", label: "Todas" },
            { value: "publica", label: "Públicas" },
            { value: "invitacion", label: "Por invitación" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filtros, visibilidad: opt.value as any })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filtros.visibilidad === opt.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Días para postular
        </label>
        <input
          type="range"
          min={0}
          max={30}
          value={filtros.diasMaximo}
          onChange={(e) => onChange({ ...filtros, diasMaximo: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="text-right text-xs font-medium text-foreground">≤ {filtros.diasMaximo} días</div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Precio mínimo
        </label>
        <div className="space-y-1">
          {[
            { value: 0, label: "Cualquiera" },
            { value: 500_000, label: "≥ $ 500K" },
            { value: 1_000_000, label: "≥ $ 1M" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="radio"
                name="precio-min"
                checked={filtros.precioMinimo === opt.value}
                onChange={() => onChange({ ...filtros, precioMinimo: opt.value })}
                className="accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  </aside>
);
