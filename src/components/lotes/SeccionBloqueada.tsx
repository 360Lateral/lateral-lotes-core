import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NivelUsuario } from "@/hooks/useLoteDetalle";

interface SeccionBloqueadaProps {
  nivelRequerido: NivelUsuario;
  nivelActual: NivelUsuario;
  tipo: string;
  mostrarBotonContacto?: boolean;
  anonimo?: boolean;
}

const labelNivel: Record<NivelUsuario, string> = {
  gratuito: "Gratuito",
  basico: "Básico",
  profesional: "Profesional",
  premium: "Premium",
};

const SeccionBloqueada = ({
  nivelRequerido,
  nivelActual,
  tipo,
  mostrarBotonContacto = false,
  anonimo = false,
}: SeccionBloqueadaProps) => {
  return (
    <Card className="p-6 border-dashed bg-muted/30 flex flex-col items-center text-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-base font-semibold">
          Información disponible con plan {labelNivel[nivelRequerido]}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Para ver {tipo}, necesitas plan {labelNivel[nivelRequerido]}.
          {!anonimo && ` Tu plan actual: ${labelNivel[nivelActual]}.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center pt-1">
        {anonimo || nivelActual === "gratuito" ? (
          <Button asChild variant="default" size="sm">
            <Link to={anonimo ? "/login" : "/planes"}>
              {anonimo ? "Registrarme" : "Sube de plan"}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to="/planes">Sube de plan</Link>
          </Button>
        )}
        {mostrarBotonContacto && (
          <Button asChild variant="outline" size="sm">
            <a href="mailto:contacto@360lateral.com">Hablar con 360Lateral</a>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SeccionBloqueada;
