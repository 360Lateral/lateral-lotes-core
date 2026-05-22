import { FileText, Presentation, BookOpen, Paperclip, File } from "lucide-react";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";

interface Props {
  tipo: TipoEntregable;
  size?: number;
  className?: string;
}

const TipoEntregableIcon = ({ tipo, size = 18, className }: Props) => {
  const Icon =
    tipo === "informe_final_pdf"
      ? FileText
      : tipo === "presentacion_gamma"
        ? Presentation
        : tipo === "informe_area"
          ? BookOpen
          : tipo === "documento_soporte"
            ? Paperclip
            : File;
  return <Icon size={size} className={className} />;
};

export default TipoEntregableIcon;
