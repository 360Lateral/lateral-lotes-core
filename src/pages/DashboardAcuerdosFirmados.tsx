import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSignature } from "lucide-react";
import { useAcuerdosFirmadosAdmin } from "@/hooks/useAcuerdosFirmadosAdmin";

const formatFecha = (s: string) =>
  new Date(s).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const DashboardAcuerdosFirmados = () => {
  const { data = [], isLoading } = useAcuerdosFirmadosAdmin();
  const [filtroDev, setFiltroDev] = useState("");
  const [filtroLote, setFiltroLote] = useState("");

  const filtrados = useMemo(() => {
    const fd = filtroDev.trim().toLowerCase();
    const fl = filtroLote.trim().toLowerCase();
    return data.filter((r) => {
      if (fd) {
        const txt = `${r.desarrollador?.nombre ?? ""} ${r.desarrollador?.email ?? ""}`.toLowerCase();
        if (!txt.includes(fd)) return false;
      }
      if (fl) {
        const txt = `${r.lote?.nombre_lote ?? ""} ${r.lote?.ciudad ?? ""} ${r.lote_id}`.toLowerCase();
        if (!txt.includes(fl)) return false;
      }
      return true;
    });
  }, [data, filtroDev, filtroLote]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Acuerdos firmados</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Evidencia de aceptación del Acuerdo de Confidencialidad y No Elusión por parte de
              desarrolladores. Esta evidencia respalda la exigibilidad de la cláusula de no elusión.
            </p>
          </div>
        </header>

        <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Filtrar por desarrollador (nombre o email)"
            value={filtroDev}
            onChange={(e) => setFiltroDev(e.target.value)}
          />
          <Input
            placeholder="Filtrar por lote (nombre, ciudad o id)"
            value={filtroLote}
            onChange={(e) => setFiltroLote(e.target.value)}
          />
        </Card>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Desarrollador</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Versión</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay acuerdos firmados que coincidan.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.desarrollador?.nombre ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.desarrollador?.email ?? r.desarrollador_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.lote?.nombre_lote ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.lote?.ciudad ?? ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.version_nda === "v2.0" ? "default" : "secondary"}>
                        {r.version_nda}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatFecha(r.fecha_firma)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {r.ip ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <p className="text-xs text-muted-foreground">
          Total: {filtrados.length} {filtrados.length === 1 ? "registro" : "registros"}.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAcuerdosFirmados;
