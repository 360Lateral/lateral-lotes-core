import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink } from "lucide-react";
import { useEngagementActivoDelLote } from "@/hooks/useEngagementActivoDelLote";
import CrearEngagementDialog from "@/components/portafolio/CrearEngagementDialog";

interface Props {
  loteId: string | undefined;
  canCreate: boolean;
}

const EngagementBannerLote = ({ loteId, canCreate }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: engagementId, isLoading } = useEngagementActivoDelLote(loteId);

  if (!loteId || isLoading) return null;

  if (engagementId) {
    return (
      <div className="mb-6 flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to={`/dashboard/engagements/${engagementId}`}>
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Ver engagement activo
          </Link>
        </Button>
      </div>
    );
  }

  if (!canCreate) return null;

  return (
    <>
      <Card className="mb-6 border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-foreground">
              Este lote aún no tiene engagement
            </p>
            <p className="mt-1 font-body text-xs text-muted-foreground">
              Crea uno para iniciar el análisis técnico y vincular el lote al flujo de servicios 360°.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="sm:shrink-0">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Crear engagement
          </Button>
        </CardContent>
      </Card>

      <CrearEngagementDialog
        loteId={loteId}
        open={open}
        onOpenChange={setOpen}
        onCreated={(id) => navigate(`/dashboard/engagements/${id}`)}
      />
    </>
  );
};

export default EngagementBannerLote;
