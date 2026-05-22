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
  en_progreso: "hsl(var(--primary))",
  en_revision: "hsl(var(--warning))",
  entregado: "hsl(var(--success))",
  cancelado: "hsl(var(--destructive))",
};

const colorFor = (estado: string) =>
  COLOR_BY_ESTADO[estado] ?? "hsl(var(--muted-foreground))";

const DistribucionEstadosChart = ({ data }: { data: EstadoRow[] }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
          Engagements por estado
        </h2>
        {data.length === 0 ? (
          <p className="py-12 text-center font-body text-sm text-muted-foreground">
            Aún no hay engagements creados.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="cantidad"
                  nameKey="estado"
                  innerRadius={40}
                  outerRadius={70}
                  label={(entry: { estado: string; cantidad: number }) =>
                    `${entry.estado}: ${entry.cantidad}`
                  }
                  labelLine={false}
                >
                  {data.map((row) => (
                    <Cell key={row.estado} fill={colorFor(row.estado)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DistribucionEstadosChart;
