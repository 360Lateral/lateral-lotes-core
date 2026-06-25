import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TendenciaMensualFila } from "@/hooks/useTendenciaMensual";
import { formatCOP } from "@/lib/format-moneda";

interface Props {
  data: TendenciaMensualFila[];
}

const formatMillones = (n: number) => {
  const millones = (n ?? 0) / 1_000_000;
  if (millones >= 1) return `$${millones.toFixed(1)}M`;
  const miles = (n ?? 0) / 1_000;
  if (miles >= 1) return `$${miles.toFixed(0)}K`;
  return `$${n ?? 0}`;
};

const tickAxis = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
};

const EmptyTendencia = () => (
  <EmptyState
    icon={TrendingUp}
    titulo="Sin datos en el periodo seleccionado"
    descripcion="Cambia el rango de fechas para ver la tendencia."
    size="sm"
    className="my-4"
  />
);

const GraficoTendencia = ({ data }: Props) => {
  const empty = data.length === 0;

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs defaultValue="engagements">
          <TabsList>
            <TabsTrigger value="engagements">Engagements</TabsTrigger>
            <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="engagements" className="mt-4">
            {empty ? (
              <EmptyTendencia />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="mes_label" tick={tickAxis} />
                    <YAxis allowDecimals={false} tick={tickAxis} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => {
                        const label =
                          name === "engagements_creados" ? "Creados" : "Completados";
                        return [value, label];
                      }}
                      labelFormatter={(l) => l}
                    />
                    <Bar
                      dataKey="engagements_creados"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="engagements_completados"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--success))" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ingresos" className="mt-4">
            {empty ? (
              <EmptyTendencia />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <defs>
                      <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="mes_label" tick={tickAxis} />
                    <YAxis tick={tickAxis} tickFormatter={formatMillones} width={70} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [formatCOP(value), "Ingresos"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="ingresos_cop"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      fill="url(#gradIngresos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            {empty ? (
              <EmptyTendencia />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="mes_label" tick={tickAxis} />
                    <YAxis allowDecimals={false} tick={tickAxis} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [value, "Leads nuevos"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads_nuevos"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--warning))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GraficoTendencia;
