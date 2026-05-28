import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMisActivos } from "@/hooks/useMisActivos";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, PackageOpen, FileSearch } from "lucide-react";
import { Link } from "react-router-dom";
import PublicarActivoDialog from "./PublicarActivoDialog";
import SolicitarDiagnosticoDialog from "./SolicitarDiagnosticoDialog";

const fmtCOP = (n: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

const EstadoBadge = ({ estado }: { estado: string }) => {
  switch (estado) {
    case "pendiente_validacion":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
          Pendiente validación de 360Lateral
        </Badge>
      );
    case "aprobado":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
          Publicado en mercado
        </Badge>
      );
    case "rechazado":
      return <Badge variant="destructive">Requiere ajustes</Badge>;
    case "retirado":
      return <Badge variant="secondary">Retirado del mercado</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

const MisActivosTab = () => {
  const { user } = useAuth();
  const { data: activos = [], isLoading } = useMisActivos(user?.id);
  const [openDialog, setOpenDialog] = useState(false);
  const [loteParaDiagnostico, setLoteParaDiagnostico] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Activos que has publicado o que están en proceso de validación.
        </p>
        <Button onClick={() => setOpenDialog(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Publicar un activo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : activos.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <PackageOpen className="h-14 w-14 text-muted-foreground/40" />
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-semibold">
                Aún no has publicado activos en venta.
              </h3>
              <p className="text-sm text-muted-foreground">
                Empieza con el botón "Publicar un activo" para que 360Lateral
                lo revise y lo muestre a desarrolladores interesados.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activos.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="h-32 w-full bg-muted flex items-center justify-center">
                {a.foto_url ? (
                  <img
                    src={a.foto_url}
                    alt={a.nombre_lote ?? "Lote"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MapPin className="h-10 w-10 text-muted-foreground/30" />
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold truncate">
                    {a.nombre_lote || "(sin nombre)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {[a.barrio, a.ciudad].filter(Boolean).join(" · ") ||
                      "Ubicación no especificada"}
                  </p>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Precio sugerido: </span>
                  <span className="font-medium">
                    {fmtCOP(a.precio_venta_estimado)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <EstadoBadge estado={a.estado_publicacion} />
                </div>

                {a.estado_publicacion === "rechazado" && a.notas_publicacion && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                    <span className="font-semibold">Motivo:</span>{" "}
                    {a.notas_publicacion}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/lotes/${a.id}`}>Ver detalle</Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setLoteParaDiagnostico(a.id)}
                  >
                    <FileSearch className="mr-1 h-4 w-4" />
                    Contratar diagnóstico
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PublicarActivoDialog open={openDialog} onOpenChange={setOpenDialog} />
      <SolicitarDiagnosticoDialog
        open={!!loteParaDiagnostico}
        onOpenChange={(v) => !v && setLoteParaDiagnostico(null)}
        loteIdPreseleccionado={loteParaDiagnostico ?? undefined}
      />
    </div>
  );
};

export default MisActivosTab;
