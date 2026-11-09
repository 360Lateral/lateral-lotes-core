import PermissionGate from "@/components/PermissionGate";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMisActivos } from "@/hooks/useMisActivos";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, PackageOpen, FileSearch, Users, MessagesSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import PublicarActivoDialog from "./PublicarActivoDialog";
import GestionarComisionistasDialog from "./GestionarComisionistasDialog";
import SolicitarDiagnosticoDialog from "./SolicitarDiagnosticoDialog";
import { FotoLote } from "@/components/lotes/FotoLote";
import { formatCOP } from "@/lib/format-moneda";

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
  const loteIds = activos.map((a) => a.id);
  const { data: negociacionesPorLote = {} } = useQuery({
    queryKey: ["portal-negociaciones-activas", user?.id, loteIds],
    enabled: !!user?.id && loteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negociaciones")
        .select("id, lote_id, created_at")
        .eq("estado", "activa")
        .eq("owner_id", user!.id)
        .in("lote_id", loteIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, { count: number; ultimaId: string }> = {};
      for (const n of data ?? []) {
        if (map[n.lote_id]) map[n.lote_id].count++;
        else map[n.lote_id] = { count: 1, ultimaId: n.id };
      }
      return map;
    },
  });
  const [loteParaDiagnostico, setLoteParaDiagnostico] = useState<string | null>(null);
  const [loteParaComisionistas, setLoteParaComisionistas] = useState<
    { id: string; nombre: string | null } | null
  >(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Activos que has publicado o que están en proceso de validación.
        </p>
        <PermissionGate permiso="publicar_activo"><Button onClick={() => setOpenDialog(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Publicar un activo
        </Button></PermissionGate>
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
                  <FotoLote
                    url={a.foto_url}
                    alt={a.nombre_lote ?? "Lote"}
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
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
                    {formatCOP(a.precio_venta_estimado)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <EstadoBadge estado={a.estado_publicacion} />
                </div>

                {negociacionesPorLote[a.id] && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="min-h-10 bg-blue-600 hover:bg-blue-600 text-white px-3">
                      {negociacionesPorLote[a.id].count === 1
                        ? "1 negociación activa"
                        : `${negociacionesPorLote[a.id].count} negociaciones activas`}
                    </Badge>
                    <PermissionGate permiso="sala_negociacion"><Button size="sm" className="hidden sm:inline-flex min-h-10" asChild>
                      <Link to={`/negociacion/${negociacionesPorLote[a.id].ultimaId}`}>
                        <MessagesSquare className="mr-1 h-4 w-4" />
                        Ir a la sala
                      </Link>
                    </Button></PermissionGate>
                  </div>
                )}

                {a.estado_publicacion === "rechazado" && a.notas_publicacion && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                    <span className="font-semibold">Motivo:</span>{" "}
                    {a.notas_publicacion}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {negociacionesPorLote[a.id] && (
                    <PermissionGate permiso="sala_negociacion"><Button size="sm" className="sm:hidden min-h-11 w-full" asChild>
                      <Link to={`/negociacion/${negociacionesPorLote[a.id].ultimaId}`}>
                        <MessagesSquare className="mr-1 h-4 w-4" />
                        Ir a la sala
                      </Link>
                    </Button></PermissionGate>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11 w-full sm:min-h-0 sm:w-auto"
                    asChild
                  >
                    <Link to={`/lotes/${a.id}`}>Ver detalle</Link>
                  </Button>
                  <PermissionGate permiso="contratar_diagnostico"><Button
                    variant="default"
                    size="sm"
                    className="min-h-11 w-full sm:min-h-0 sm:w-auto"
                    onClick={() => setLoteParaDiagnostico(a.id)}
                  >
                    <FileSearch className="mr-1 h-4 w-4" />
                    Contratar diagnóstico
                  </Button></PermissionGate>
                  <PermissionGate permiso="gestionar_comisionistas"><Button
                    variant="outline"
                    size="sm"
                    className="min-h-11 w-full sm:min-h-0 sm:w-auto sm:col-span-2"
                    onClick={() =>
                      setLoteParaComisionistas({ id: a.id, nombre: a.nombre_lote })
                    }
                  >
                    <Users className="mr-1 h-4 w-4" />
                    Gestionar comisionistas
                  </Button></PermissionGate>
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
      {loteParaComisionistas && (
        <GestionarComisionistasDialog
          open={!!loteParaComisionistas}
          onOpenChange={(v) => !v && setLoteParaComisionistas(null)}
          lote={loteParaComisionistas}
        />
      )}
    </div>
  );
};

export default MisActivosTab;
