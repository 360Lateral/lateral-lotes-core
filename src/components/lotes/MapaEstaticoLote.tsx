import { useState } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { cn } from "@/lib/utils";

interface MapaEstaticoLoteProps {
  lat?: number | null;
  lng?: number | null;
  nombre?: string;
  className?: string;
}

const Placeholder = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex h-full w-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground",
      className,
    )}
  >
    <MapPin className="h-6 w-6" />
    <span className="text-xs">Sin ubicación</span>
  </div>
);

const MapaEstaticoLote = ({ lat, lng, nombre, className }: MapaEstaticoLoteProps) => {
  const { data: apiKey } = useGoogleMapsKey();
  const [errored, setErrored] = useState(false);

  if (lat == null || lng == null || !apiKey || errored) {
    return <Placeholder className={className} />;
  }

  const url =
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
    `&zoom=15&size=400x180&scale=2` +
    `&markers=color:0xF5A623%7C${lat},${lng}&key=${apiKey}`;

  return (
    <img
      src={url}
      alt={nombre ? `Ubicación de ${nombre}` : "Ubicación del lote"}
      loading="lazy"
      className={cn("h-full w-full object-cover", className)}
      onError={() => setErrored(true)}
    />
  );
};

export default MapaEstaticoLote;
