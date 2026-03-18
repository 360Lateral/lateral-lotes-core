import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScoreIndicator from "@/components/ScoreIndicator";
import { Landmark } from "lucide-react";

import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";

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
  uso_principal?: string | null;
  has_resolutoria?: boolean | null;
  foto_url?: string | null;
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

const LoteCard = ({ id, nombre, barrio, area_m2, precio_m2, estado, lat, lng, score_juridico, score_normativo, score_servicios, uso_principal, has_resolutoria, foto_url }: LoteCardProps) => {
  const { data: mapsKey } = useGoogleMapsKey();
  const hasCoords = lat != null && lng != null;
  const staticMapUrl = hasCoords && mapsKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x176&scale=2&maptype=hybrid&markers=color:0x1D3461%7C${lat},${lng}&key=${mapsKey}`
    : null;
  const imageUrl = foto_url || staticMapUrl;

  return (
  <div className="flex flex-col overflow-hidden rounded-lg border border-gray-light bg-card">
    {imageUrl ? (
      <img src={imageUrl} alt={`Foto de ${nombre}`} className="h-22 w-full object-cover" />
    ) : (
      <div className="flex h-22 items-center justify-center bg-secondary">
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

      {/* Uso de suelo + Resolutoría */}
      <div className="flex flex-wrap items-center gap-2">
        {uso_principal && (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground">
            <Landmark className="h-3 w-3" />
            {uso_principal}
          </span>
        )}
        {has_resolutoria && (
          <span className="inline-flex items-center gap-1 rounded bg-[#2ecc71]/15 px-2 py-0.5 font-body text-xs font-medium text-[#2ecc71]">
            ✓ Norma 360° Verificada
          </span>
        )}
      </div>

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

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <ScoreIndicator score={score_juridico ?? null} label="Jurídico" emoji="⚖️" size="sm" />
        <ScoreIndicator score={score_normativo ?? null} label="Normativo" emoji="📋" size="sm" />
        <ScoreIndicator score={score_servicios ?? null} label="Servicios" emoji="🔌" size="sm" />
      </div>

      <Button variant="default" size="sm" className="mt-3 w-full" asChild>
        <Link to={`/lotes/${id}`}>Ver detalle</Link>
      </Button>
    </div>
  </div>
  );
};

export default LoteCard;
