import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Trophy, AlertTriangle, ChevronDown } from "lucide-react";

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const fechaRelativa = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "hace segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
};

interface Props {
  propuesta: any;
  contrato?: any;
  orden: any;
  puedeAdjudicar: boolean;
  onAdjudicar: (propuestaId: string) => void;
  adjudicando?: boolean;
}

const estadoBadge = (estado: string) => {
  switch (estado) {
    case "ganadora":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
          <Trophy className="h-3 w-3" /> Ganadora
        </Badge>
      );
    case "rechazada":
      return <Badge variant="destructive">Rechazada</Badge>;
    case "retirada":
      return <Badge variant="secondary">Retirada</Badge>;
    case "enviada":
    default:
      return <Badge variant="outline">Enviada</Badge>;
  }
};

const PropuestaComparativaCard = ({
  propuesta,
  contrato,
  puedeAdjudicar,
  onAdjudicar,
  adjudicando,
}: Props) => {
  const [openMsg, setOpenMsg] = useState(false);
  const esGanadora = propuesta.estado === "ganadora";
  const experto = propuesta.experto;
  const nombre = experto?.nombre ?? "Experto";

  const precio = Number(propuesta.precio_propuesto);
  const fueraRango =
    contrato &&
    (precio < Number(contrato.precio_min) || precio > Number(contrato.precio_max));

  return (
    <Card className={esGanadora ? "border-2 border-emerald-500" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-foreground">{nombre}</p>
            <p className="text-xs text-muted-foreground">{experto?.email ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            {experto?.nivel_suscripcion && (
              <Badge variant="secondary" className="capitalize">
                {experto.nivel_suscripcion}
              </Badge>
            )}
            {estadoBadge(propuesta.estado)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Precio</p>
            <p className="font-semibold text-foreground flex items-center gap-1">
              {fmtCOP(precio)}
              {fueraRango && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plazo</p>
            <p className="font-semibold text-foreground">
              {propuesta.plazo_propuesto_dias} días
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Enviada</p>
            <p className="text-sm">{fechaRelativa(propuesta.fecha_propuesta)}</p>
          </div>
        </div>

        {propuesta.mensaje_experto && (
          <Collapsible open={openMsg} onOpenChange={setOpenMsg}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <ChevronDown
                  className={`h-3 w-3 mr-1 transition-transform ${openMsg ? "rotate-180" : ""}`}
                />
                {openMsg ? "Ocultar mensaje" : "Ver mensaje del experto"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/40 p-2">
                {propuesta.mensaje_experto}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {propuesta.estado === "enviada" && puedeAdjudicar && (
          <div className="pt-2 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={adjudicando}
                >
                  {adjudicando ? "Adjudicando..." : "Adjudicar a este experto"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Adjudicar a {nombre}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto rechazará automáticamente las demás propuestas y notificará
                    a todos los expertos. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onAdjudicar(propuesta.id)}>
                    Adjudicar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropuestaComparativaCard;
