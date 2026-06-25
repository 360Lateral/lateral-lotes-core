import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, User as UserIcon, ArrowRight } from "lucide-react";
import { useAsignarLotesMasivo } from "@/hooks/admin/useAsignarLotesMasivo";
import { usePropietariosList } from "@/hooks/useAsignarPropietario";
import { formatCOP, formatMetros } from "@/lib/format-moneda";
import { cn } from "@/lib/utils";
import type { GrupoLotesHuerfanos } from "@/hooks/admin/useLotesHuerfanosAgrupados";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupo: GrupoLotesHuerfanos;
}

export default function AsignarMasivoDialog({ open, onOpenChange, grupo }: Props) {
  const [tipoUsuario, setTipoUsuario] = useState<"propietario" | "desarrollador">("propietario");
  const [busqueda, setBusqueda] = useState("");
  const [usuarioDestinoId, setUsuarioDestinoId] = useState<string | null>(null);

  const { data: usuarios } = usePropietariosList(tipoUsuario);
  const asignar = useAsignarLotesMasivo();

  const usuariosFiltrados = (usuarios ?? []).filter((u) => {
    const s = busqueda.toLowerCase();
    if (!s) return true;
    return (
      (u.nombre?.toLowerCase().includes(s) ?? false) ||
      (u.email?.toLowerCase().includes(s) ?? false)
    );
  });

  const handleSubmit = async () => {
    if (!usuarioDestinoId) return;
    await asignar.mutateAsync({
      lote_ids: grupo.lote_ids,
      usuario_destino_id: usuarioDestinoId,
    });
    onOpenChange(false);
    setUsuarioDestinoId(null);
    setBusqueda("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Asignar {grupo.cantidad_lotes} lote(s) de "{grupo.nombre_propietario}"
          </DialogTitle>
          <DialogDescription>
            Todos estos lotes pasarán a estar a nombre del usuario que selecciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen */}
          <div className="rounded-md bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad de lotes:</span>
              <span className="font-medium">{grupo.cantidad_lotes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Área total:</span>
              <span className="font-medium">{formatMetros(grupo.area_total_m2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valoración total estimada:</span>
              <span className="font-medium">{formatCOP(grupo.valoracion_total)}</span>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <Label>Tipo de usuario destino</Label>
            <RadioGroup
              value={tipoUsuario}
              onValueChange={(v) => {
                setTipoUsuario(v as "propietario" | "desarrollador");
                setUsuarioDestinoId(null);
              }}
              className="flex gap-4 mt-1"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="propietario" id="r-prop" />
                <span>Propietario</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="desarrollador" id="r-dev" />
                <span>Desarrollador</span>
              </label>
            </RadioGroup>
          </div>

          {/* Buscador */}
          <div>
            <Label>Buscar usuario destino</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Por nombre o email..."
                className="pl-8"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-56 overflow-y-auto border rounded-md">
            {usuariosFiltrados.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {busqueda ? "No se encontraron usuarios" : `No hay usuarios tipo ${tipoUsuario}`}
              </div>
            ) : (
              usuariosFiltrados.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUsuarioDestinoId(u.id)}
                  className={cn(
                    "w-full text-left p-2 hover:bg-muted/50 border-b last:border-b-0 flex items-center gap-2",
                    usuarioDestinoId === u.id && "bg-primary/10",
                  )}
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.nombre ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {usuarioDestinoId === u.id && (
                    <Badge variant="secondary">Seleccionado</Badge>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Advertencia */}
          <div className="flex gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-900">
              Esta acción es reversible: si te equivocas, puedes reasignar individualmente desde
              el detalle de cada lote. Solo super_admin puede reasignar lotes ya asignados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!usuarioDestinoId || asignar.isPending}>
            {asignar.isPending ? (
              "Asignando..."
            ) : (
              <>
                Asignar {grupo.cantidad_lotes} lote(s)
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
