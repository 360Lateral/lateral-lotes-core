import { FileText, Presentation, BookOpen, Paperclip, File } from "lucide-react";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";

interface Props {
  tipo: TipoEntregable;
  size?: number;
  className?: string;
}

const TipoEntregableIcon = ({ tipo, size = 18, className }: Props) => {
  const Icon =
    tipo === "diagnostico_inmobiliario"
      ? FileText
      : tipo === "presentacion_diagnostico"
        ? Presentation
        : tipo === "informe_area"
          ? BookOpen
          : tipo === "documento_soporte"
            ? Paperclip
            : File;
  return <Icon size={size} className={className} />;
};

export default TipoEntregableIcon;
