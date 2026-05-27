import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContratoMarco, useContratosMarco } from "@/hooks/useContratosMarco";
import { useToggleContratoActivo } from "@/hooks/useToggleContratoActivo";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipoAnalisisId: string;
  tipoAnalisisNombre: string;
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const HistorialContratosDialog = ({
  open,
  onOpenChange,
  tipoAnalisisId,
  tipoAnalisisNombre,
}: Props) => {
  const { data: todos = [] } = useContratosMarco(false);
  const toggleMut = useToggleContratoActivo();
  const [verContenido, setVerContenido] = useState<ContratoMarco | null>(null);
  const [confirmar, setConfirmar] = useState<{ c: ContratoMarco; activar: boolean } | null>(null);

  const versiones = todos
    .filter((c) => c.tipo_analisis_id === tipoAnalisisId)
    .sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial — {tipoAnalisisNombre}</DialogTitle>
            <DialogDescription>{versiones.length} versión(es)</DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versiones.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.version}</TableCell>
                    <TableCell>
                      {c.activo ? (
                        <Badge>Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {fmtCOP(c.precio_min)} – {fmtCOP(c.precio_max)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.plazo_min_dias} – {c.plazo_max_dias} días
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(c.created_at).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="outline" onClick={() => setVerContenido(c)}>
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant={c.activo ? "destructive" : "default"}
                        disabled={toggleMut.isPending}
                        onClick={() => setConfirmar({ c, activar: !c.activo })}
                      >
                        {c.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verContenido} onOpenChange={(v) => !v && setVerContenido(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tipoAnalisisNombre} — {verContenido?.version}
            </DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-4 rounded">
            {verContenido?.contenido_legal}
          </pre>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmar}
        onOpenChange={(v) => !v && setConfirmar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmar?.activar ? "Activar contrato" : "Desactivar contrato"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar?.activar
                ? `Vas a activar ${confirmar.c.version}. Cualquier otra versión activa de este tipo se desactivará automáticamente.`
                : `Vas a desactivar ${confirmar?.c.version}. Los expertos no podrán postular a órdenes de este tipo si no hay otra versión activa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmar) {
                  toggleMut.mutate(
                    { id: confirmar.c.id, activo: confirmar.activar },
                    { onSettled: () => setConfirmar(null) },
                  );
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HistorialContratosDialog;
