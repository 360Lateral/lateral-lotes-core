import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star, Image as ImageIcon, MapPin, MoreHorizontal,
  Pencil, ClipboardList, FileText, Trash2, UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MapaEstaticoLote from "./MapaEstaticoLote";
import { cn } from "@/lib/utils";

export interface LoteCardData {
  id: string;
  nombre_lote: string;
  ciudad: string | null;
  barrio: string | null;
  area_total_m2: number | null;
  tipo_lote: string | null;
  estado_disponibilidad: string;
  destacado: boolean | null;
  es_publico: boolean;
  propietario_id: string | null;
  publicado_venta: boolean;
  precio_venta_estimado: number | null;
  lat: number | null;
  lng: number | null;
  foto_principal: string | null;
  propietario_nombre?: string | null;
  plan_nombre?: string | null;
  plan_codigo?: string | null;
}

interface Props {
  lote: LoteCardData;
  onAsignarPropietario: () => void;
  onTogglePublico: (next: boolean) => void;
  onPublicarMercado: () => void;
  onRetirarMercado: () => void;
  onCrearOrden: () => void;
  onEliminar: () => void;
}

const planBadgeClass = (codigo?: string | null) => {
  switch ((codigo ?? "").toLowerCase()) {
    case "premium":
      return "bg-success text-primary-foreground";
    case "pro":
    case "profesional":
      return "bg-warning text-primary-foreground";
    case "basico":
    case "básico":
      return "bg-secondary text-secondary-foreground";
    case "gratuito":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-background text-muted-foreground border border-border";
  }
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const LoteCardAdmin = ({
  lote, onAsignarPropietario, onTogglePublico, onPublicarMercado,
  onRetirarMercado, onCrearOrden, onEliminar,
}: Props) => {
  const hasPhoto = !!lote.foto_principal;
  const [vista, setVista] = useState<"foto" | "mapa">(hasPhoto ? "foto" : "mapa");

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative h-[180px] w-full bg-muted">
        {vista === "foto" && hasPhoto ? (
          <img
            src={lote.foto_principal!}
            alt={lote.nombre_lote}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <MapaEstaticoLote lat={lote.lat} lng={lote.lng} nombre={lote.nombre_lote} />
        )}

        {hasPhoto && (
          <div className="absolute top-2 right-2 flex gap-1 rounded-md bg-background/90 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setVista("foto")}
              className={cn(
                "rounded p-1 transition-colors",
                vista === "foto" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              title="Ver foto"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVista("mapa")}
              className={cn(
                "rounded p-1 transition-colors",
                vista === "mapa" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              title="Ver mapa"
            >
              <MapPin className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {lote.destacado && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
            <Star className="h-3 w-3 fill-current" />
            Destacado
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate font-semibold text-foreground">{lote.nombre_lote}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") || "Sin ubicación"}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {lote.plan_nombre && (
            <Badge className={`text-[10px] ${planBadgeClass(lote.plan_codigo)}`}>{lote.plan_nombre}</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{lote.estado_disponibilidad}</Badge>
          {lote.publicado_venta && (
            <Badge className="bg-success text-primary-foreground text-[10px]">En mercado</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground">Área</p>
            <p className="font-medium text-foreground">
              {lote.area_total_m2 ? `${Number(lote.area_total_m2).toLocaleString("es-CO")} m²` : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Uso</p>
            <p className="font-medium text-foreground truncate">{lote.tipo_lote ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Propietario</p>
            {lote.propietario_id ? (
              <p className="font-medium text-foreground truncate">{lote.propietario_nombre ?? "—"}</p>
            ) : (
              <button
                type="button"
                onClick={onAsignarPropietario}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <UserPlus className="h-3 w-3" /> Asignar
              </button>
            )}
          </div>
          {lote.publicado_venta && lote.precio_venta_estimado != null && (
            <div>
              <p className="text-muted-foreground">Precio</p>
              <p className="font-medium text-foreground">{formatCOP(Number(lote.precio_venta_estimado))}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={lote.es_publico}
            onCheckedChange={onTogglePublico}
            aria-label="Visibilidad pública"
          />
          <span>Público</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" asChild className="h-7 text-xs">
            <Link to={`/dashboard/lotes/${lote.id}/editar`}>
              <Pencil className="mr-1 h-3 w-3" /> Editar
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCrearOrden}>
                <ClipboardList className="mr-2 h-4 w-4" /> Crear orden de servicio
              </DropdownMenuItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem disabled>
                        <FileText className="mr-2 h-4 w-4" /> Generar ficha
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Disponible próximamente</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuSeparator />
              {lote.publicado_venta ? (
                <DropdownMenuItem onClick={onRetirarMercado}>
                  Retirar del mercado
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onPublicarMercado}>
                  Publicar en mercado
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default LoteCardAdmin;
