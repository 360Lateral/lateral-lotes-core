import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfigPayPerView } from "@/hooks/useConfigPayPerView";
import { Eye } from "lucide-react";
import { formatCOP } from "@/lib/format-moneda";

const PayPerViewBanner = () => {
  const { data: config } = useConfigPayPerView();
  const precio = config?.precio_cop ?? 30000;
  const dias = config?.dias_acceso ?? 30;

  return (
    <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-secondary md:text-xl">
              ¿Solo quieres ver un lote específico?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pago único de <span className="font-semibold text-primary">{formatCOP(precio)}</span>{" "}
              · {dias} días de acceso a toda su información, sin suscripción.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ideal si encontraste un lote en específico y quieres ver su detalle completo.
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="md:shrink-0">
          <Link to="/lotes">Buscar lote y pagar</Link>
        </Button>
      </div>
    </Card>
  );
};

export default PayPerViewBanner;
