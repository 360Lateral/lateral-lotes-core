import { Card, CardContent } from "@/components/ui/card";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface EstadoRow {
  estado: string;
  cantidad: number;
}

const COLOR_BY_ESTADO: Record<string, string> = {
  pendiente: "hsl(var(--muted-foreground))",
  prospecto: "hsl(var(--muted-foreground))",
  en_progreso: "hsl(var(--primary))",
  en_revision: "hsl(var(--warning))",
  activo: "hsl(var(--success))",
  entregado: "hsl(var(--success))",
  cerrado: "hsl(var(--muted-foreground))",
  cancelado: "hsl(var(--destructive))",
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  prospecto: "Prospecto",
  en_progreso: "En progreso",
  en_revision: "En revisión",
  activo: "Activo",
  entregado: "Entregado",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const colorFor = (estado: string) =>
  COLOR_BY_ESTADO[estado] ?? "hsl(var(--muted-foreground))";

const DistribucionEstadosChart = ({ data }: { data: EstadoRow[] }) => {
  const visibles = data.filter((d) => Number(d.cantidad) > 0);
  const total = visibles.reduce((acc, d) => acc + Number(d.cantidad), 0);

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
          Engagements por estado
        </h2>
        {visibles.length === 0 ? (
          <p className="py-12 text-center font-body text-sm text-muted-foreground">
            Aún no hay engagements creados.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 items-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visibles}
                    dataKey="cantidad"
                    nameKey="estado"
                    innerRadius={44}
                    outerRadius={72}
                    paddingAngle={1}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {visibles.map((row) => (
                      <Cell key={row.estado} fill={colorFor(row.estado)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      ESTADO_LABEL[name] ?? name,
                    ]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5 text-xs">
              {visibles
                .slice()
                .sort((a, b) => Number(b.cantidad) - Number(a.cantidad))
                .map((row) => {
                  const pct = total > 0 ? (Number(row.cantidad) / total) * 100 : 0;
                  return (
                    <li
                      key={row.estado}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ background: colorFor(row.estado) }}
                        />
                        <span className="truncate text-foreground">
                          {ESTADO_LABEL[row.estado] ?? row.estado}
                        </span>
                      </span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {row.cantidad}{" "}
                        <span className="text-muted-foreground/70">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DistribucionEstadosChart;
