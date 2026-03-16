import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Phone } from "lucide-react";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const DiagnosticoResultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    municipio?: string;
    area?: number;
    tipo?: string;
    estimacion?: { min: number; avg: number; max: number; count: number };
  } | null;

  if (!state?.estimacion) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No hay resultados disponibles.</p>
            <Button variant="outline" onClick={() => navigate("/diagnostico")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al diagnóstico
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { municipio, area = 0, tipo, estimacion } = state;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 lg:py-20">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-muted-foreground"
            onClick={() => navigate("/diagnostico")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nueva consulta
          </Button>

          <h1 className="font-heading text-3xl font-bold text-secondary mb-2">
            Resultado del Diagnóstico 360°
          </h1>
          <p className="text-muted-foreground mb-8">
            Estimación referencial para{" "}
            <span className="font-semibold text-foreground">{municipio}</span> —{" "}
            {tipo}
          </p>

          {/* Results card */}
          <div className="rounded-xl p-6 md:p-8 bg-secondary text-secondary-foreground space-y-6">
            <div>
              <p className="text-secondary-foreground/70 text-sm mb-1">
                Precio por m² en {municipio}
              </p>
              <p className="text-lg">
                Entre{" "}
                <span className="text-primary font-bold">
                  {formatCOP(estimacion.min)}
                </span>{" "}
                y{" "}
                <span className="text-primary font-bold">
                  {formatCOP(estimacion.max)}
                </span>{" "}
                por m²
              </p>
            </div>

            <div>
              <p className="text-secondary-foreground/70 text-sm mb-1">
                Estimación total de tu lote
              </p>
              <p className="text-lg">
                Tu lote de{" "}
                <span className="text-primary font-bold">
                  {area.toLocaleString("es-CO")} m²
                </span>{" "}
                podría valer entre{" "}
                <span className="text-primary font-bold">
                  {formatCOP(area * estimacion.min)}
                </span>{" "}
                y{" "}
                <span className="text-primary font-bold">
                  {formatCOP(area * estimacion.max)}
                </span>
              </p>
            </div>

            <p className="text-secondary-foreground/50 text-xs">
              Basado en {estimacion.count} lote
              {estimacion.count > 1 ? "s" : ""} similar
              {estimacion.count > 1 ? "es" : ""} en la plataforma.
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate("/bienvenida")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Solicitar diagnóstico completo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/lotes")}
            >
              Ver lotes disponibles
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiagnosticoResultado;
