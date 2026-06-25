import { useState } from "react";
import { Link } from "react-router-dom";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Plus, AlertCircle } from "lucide-react";
import { usePortafolioPropietario } from "@/hooks/portal/usePortafolioPropietario";
import { generarPdfPortafolio } from "@/lib/generar-pdf-portafolio";
import { BloqueHeroEjecutivo } from "@/components/portal/portafolio/BloqueHeroEjecutivo";
import { BloqueDobleLente } from "@/components/portal/portafolio/BloqueDobleLente";
import { BloqueMapaPortafolio } from "@/components/portal/portafolio/BloqueMapaPortafolio";
import { BloqueTablaLotes } from "@/components/portal/portafolio/BloqueTablaLotes";
import { BloqueSaludAreas } from "@/components/portal/portafolio/BloqueSaludAreas";
import { BloqueAlertas } from "@/components/portal/portafolio/BloqueAlertas";
import { BloqueAcciones } from "@/components/portal/portafolio/BloqueAcciones";

const PortafolioEmpty = () => (
  <Card className="p-12 text-center max-w-xl mx-auto">
    <Building2 className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
    <h2 className="font-display text-xl font-semibold mb-2">
      Aún no tienes activos
    </h2>
    <p className="text-sm text-muted-foreground mb-6">
      Registra tu primer lote para empezar a ver el valor y potencial de tu
      portafolio inmobiliario.
    </p>
    <Button asChild>
      <Link to="/dashboard/lotes/nuevo">
        <Plus className="h-4 w-4 mr-2" />
        Registrar mi primer lote
      </Link>
    </Button>
  </Card>
);

const PortafolioLoading = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
    <Skeleton className="h-80" />
  </div>
);

const PortafolioPropietario = () => {
  const { data, isLoading, error } = usePortafolioPropietario();
  const [exportandoPdf, setExportandoPdf] = useState(false);

  return (
    <PortalClienteLayout>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">
            Mi portafolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista ejecutiva consolidada de tu patrimonio inmobiliario.
          </p>
        </header>

        {isLoading && <PortafolioLoading />}

        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3 text-red-900">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold">No pudimos cargar tu portafolio</p>
                <p className="text-sm opacity-80">
                  {(error as Error).message ?? "Intenta nuevamente en unos segundos."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {data && data.total_lotes === 0 && <PortafolioEmpty />}

        {data && data.total_lotes > 0 && (
          <>
            <BloqueHeroEjecutivo kpis={data.kpis} />
            <BloqueDobleLente lentes={data.lentes} kpis={data.kpis} />
            <BloqueMapaPortafolio lotes={data.lotes} />
            <BloqueTablaLotes lotes={data.lotes} />
            <BloqueSaludAreas areas={data.salud_areas} />
            {data.alertas.length > 0 && <BloqueAlertas alertas={data.alertas} />}
            <BloqueAcciones
              exportandoPdf={exportandoPdf}
              onExportarPdf={() => generarPdfPortafolio(data, setExportandoPdf)}
            />
          </>
        )}
      </div>
    </PortalClienteLayout>
  );
};

export default PortafolioPropietario;
