import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Briefcase } from "lucide-react";
import { formatCOP, formatMetros } from "@/lib/format-moneda";
import { estadoDiagnostico, claseEstadoDiagnostico } from "@/lib/estado-diagnostico";
import type { LotePortafolio } from "@/hooks/portal/usePortafolioPropietario";

interface Props {
  lotes: LotePortafolio[];
}

const badgeScore = (score: number | null) => {
  if (score == null) return "secondary";
  if (score >= 7) return "default";
  if (score >= 4) return "outline";
  return "destructive";
};

export const BloqueTablaLotes = ({ lotes }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Mis activos</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lote</TableHead>
              <TableHead className="text-right">Área</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-right">Valoración</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotes.map((lote) => (
              <TableRow key={lote.id}>
                <TableCell>
                  <p className="font-medium text-sm">{lote.nombre_lote}</p>
                  <p className="text-xs text-muted-foreground">
                    {lote.ciudad ?? "—"}
                    {lote.sector ? ` · ${lote.sector}` : ""}
                  </p>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatMetros(lote.area_total_m2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={badgeScore(lote.score_promedio) as any}>
                    {lote.score_promedio != null
                      ? `${lote.score_promedio.toFixed(1)}/10`
                      : "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatCOP(lote.valoracion)}
                </TableCell>
                <TableCell className="text-sm">{lote.plan_nombre ?? "—"}</TableCell>
                <TableCell>
                  {estadoDiagnostico(lote.estado) && lote.engagement_id ? (
                    <Link
                      to={`/portal/engagement/${lote.engagement_id}`}
                      className={`inline-flex min-h-6 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold hover:underline ${claseEstadoDiagnostico[estadoDiagnostico(lote.estado)!.etapa]}`}
                    >
                      {estadoDiagnostico(lote.estado)!.label}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    {lote.engagement_id && (
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/portal/engagement/${lote.engagement_id}`}>
                          <Briefcase className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/lotes/${lote.id}/ficha`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
