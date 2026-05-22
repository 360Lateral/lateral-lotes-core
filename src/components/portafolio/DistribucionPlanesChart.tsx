import { Card, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PlanRow {
  plan_codigo: string;
  plan_nombre: string;
  cantidad: number;
}

const COLOR_BY_PLAN: Record<string, string> = {
  gratuito: "hsl(var(--primary))",
  basico: "hsl(var(--secondary))",
  pro: "hsl(var(--success))",
  premium: "hsl(var(--warning))",
};

const colorFor = (codigo: string) =>
  COLOR_BY_PLAN[codigo?.toLowerCase?.()] ?? "hsl(var(--muted-foreground))";

const DistribucionPlanesChart = ({ data }: { data: PlanRow[] }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 font-body text-sm font-semibold text-foreground">
          Engagements por plan
        </h2>
        {data.length === 0 ? (
          <p className="py-12 text-center font-body text-sm text-muted-foreground">
            Aún no hay engagements creados.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  type="category"
                  dataKey="plan_nombre"
                  width={90}
                  tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {data.map((row) => (
                    <Cell key={row.plan_codigo} fill={colorFor(row.plan_codigo)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DistribucionPlanesChart;
