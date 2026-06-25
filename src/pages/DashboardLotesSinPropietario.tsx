import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Calendar, Users } from "lucide-react";
import {
  useLotesHuerfanosAgrupados,
  type GrupoLotesHuerfanos,
} from "@/hooks/admin/useLotesHuerfanosAgrupados";
import AsignarMasivoDialog from "@/components/admin/AsignarMasivoDialog";
import { formatCOP, formatMetros } from "@/lib/format-moneda";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DashboardLotesSinPropietario = () => {
  const { data: grupos, isLoading } = useLotesHuerfanosAgrupados();
  const [grupoActivo, setGrupoActivo] = useState<GrupoLotesHuerfanos | null>(null);

  const totalLotes = (grupos ?? []).reduce((s, g) => s + g.cantidad_lotes, 0);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold">Lotes sin propietario asignado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lotes que registraste a nombre de un propietario pero aún no están vinculados a un
            usuario. Asigna todos los lotes de un mismo propietario con un click.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !grupos || grupos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No hay lotes huérfanos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Todos los lotes registrados tienen propietario asignado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {grupos.length} propietario(s) con lotes sin asignar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalLotes} lotes huérfanos en total
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del propietario</TableHead>
                    <TableHead className="text-right">Lotes</TableHead>
                    <TableHead className="text-right">Área total</TableHead>
                    <TableHead className="text-right">Valoración estimada</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.map((grupo) => (
                    <TableRow key={grupo.nombre_propietario}>
                      <TableCell>
                        <p className="font-medium">{grupo.nombre_propietario}</p>
                        <p className="text-xs text-muted-foreground">
                          {grupo.nombres_lotes.slice(0, 3).join(", ")}
                          {grupo.nombres_lotes.length > 3 &&
                            ` +${grupo.nombres_lotes.length - 3} más`}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {grupo.cantidad_lotes}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMetros(grupo.area_total_m2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCOP(grupo.valoracion_total)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {format(new Date(grupo.primer_lote_creado), "d MMM", { locale: es })}
                        {grupo.primer_lote_creado !== grupo.ultimo_lote_creado && (
                          <>
                            {" · "}
                            {format(new Date(grupo.ultimo_lote_creado), "d MMM", { locale: es })}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => setGrupoActivo(grupo)}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Asignar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {grupoActivo && (
          <AsignarMasivoDialog
            open={!!grupoActivo}
            onOpenChange={(open) => !open && setGrupoActivo(null)}
            grupo={grupoActivo}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardLotesSinPropietario;
