import { Link } from "react-router-dom";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LoteMercado } from "@/hooks/useMercadoPublico";
import { formatearCategoriaArea, formatearRangoPrecio } from "@/lib/mercado-format";

interface Props {
  lote: LoteMercado;
}

// Deterministic background tone based on ciudad
const colorPorCiudad = (ciudad: string | null) => {
  if (!ciudad) return "bg-muted";
  const hash = [...ciudad].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tones = [
    "bg-primary/10 text-primary",
    "bg-secondary/10 text-secondary",
    "bg-accent/20 text-accent-foreground",
    "bg-success/10 text-success",
  ];
  return tones[hash % tones.length];
};

const TarjetaAnonima = ({ lote }: Props) => {
  const tone = colorPorCiudad(lote.ciudad);

  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className={`w-full h-24 rounded-lg flex items-center justify-center ${tone}`}>
        <Building2 className="h-10 w-10 opacity-70" />
      </div>

      <div>
        <p className="font-mono text-lg font-bold text-secondary">{lote.codigo_anonimo}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="h-3.5 w-3.5" />
          {[lote.ciudad, lote.barrio].filter(Boolean).join(" · ") || "Ubicación no especificada"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs">
          {formatearCategoriaArea(lote.categoria_area)}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {formatearRangoPrecio(lote.rango_precio)}
        </Badge>
      </div>

      {lote.uso_actual && (
        <p className="text-xs text-muted-foreground">Uso: {lote.uso_actual}</p>
      )}

      <Link
        to={`/lotes/${lote.lote_id}`}
        className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline mt-auto"
      >
        Ver más detalles <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
};

export default TarjetaAnonima;
