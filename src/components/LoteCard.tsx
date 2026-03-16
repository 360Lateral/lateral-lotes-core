import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScoreIndicator from "@/components/ScoreIndicator";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFjdHVyYWNpb250ZXJyYSIsImEiOiJjbW1wY3F3aGcwb2JiMnBweTJ1MnFrMWNxIn0.U5SBL1PDZLqAd4h9RDsx4w";

interface LoteCardProps {
  id: string;
  nombre: string;
  barrio: string;
  area_m2: number;
  precio_m2: number;
  estado: string;
  lat?: number | null;
  lng?: number | null;
  score_juridico?: number | null;
  score_normativo?: number | null;
  score_servicios?: number | null;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const estadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case "Disponible":
      return "disponible" as const;
    case "Reservado":
      return "reservado" as const;
    case "Vendido":
      return "vendido" as const;
    default:
      return "default" as const;
  }
};

const LoteCard = ({ id, nombre, barrio, area_m2, precio_m2, estado, lat, lng }: LoteCardProps) => {
  const hasCoords = lat != null && lng != null;
  const staticMapUrl = hasCoords
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+1D3461(${lng},${lat})/${lng},${lat},14,0/400x176@2x?access_token=${MAPBOX_TOKEN}`
    : null;

  return (
  <div className="flex flex-col overflow-hidden rounded-lg border border-gray-light bg-card">
    {staticMapUrl ? (
      <img src={staticMapUrl} alt={`Mapa de ${nombre}`} className="h-44 w-full object-cover" />
    ) : (
      <div className="flex h-44 items-center justify-center bg-secondary">
        <Logo variant="on-navy" className="opacity-40" />
      </div>
    )}

    <div className="flex flex-1 flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-body text-base font-semibold text-carbon leading-tight">
          {nombre}
        </h3>
        <Badge variant={estadoBadgeVariant(estado)}>{estado}</Badge>
      </div>

      <p className="font-body text-sm text-muted-foreground">{barrio}</p>

      <div className="mt-auto flex items-end justify-between pt-3">
        <div>
          <p className="font-body text-xs text-muted-foreground">Área</p>
          <p className="font-body text-sm font-semibold text-carbon">
            {area_m2.toLocaleString("es-CO")} m²
          </p>
        </div>
        <div className="text-right">
          <p className="font-body text-xs text-muted-foreground">Precio/m²</p>
          <p className="font-body text-sm font-semibold text-orange">
            {formatCOP(precio_m2)}
          </p>
        </div>
      </div>

      <Button variant="default" size="sm" className="mt-3 w-full" asChild>
        <Link to={`/lotes/${id}`}>Ver detalle</Link>
      </Button>
    </div>
  </div>
  );
};

export default LoteCard;
