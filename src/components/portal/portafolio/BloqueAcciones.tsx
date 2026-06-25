import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Sparkles, MessageCircle } from "lucide-react";

interface Props {
  exportandoPdf: boolean;
  onExportarPdf: () => void;
}

export const BloqueAcciones = ({ exportandoPdf, onExportarPdf }: Props) => (
  <section className="grid grid-cols-1 md:grid-cols-3 gap-2">
    <Button onClick={onExportarPdf} disabled={exportandoPdf}>
      {exportandoPdf ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Descargar reporte ejecutivo PDF
    </Button>
    <Button asChild variant="outline">
      <Link to="/planes">
        <Sparkles className="h-4 w-4 mr-2" />
        Mejorar plan de algún lote
      </Link>
    </Button>
    <Button asChild variant="outline">
      <a href="mailto:soporte@360lateral.com?subject=Consulta%20de%20portafolio">
        <MessageCircle className="h-4 w-4 mr-2" />
        Hablar con un asesor
      </a>
    </Button>
  </section>
);
