import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFirmarUrlEntregable } from "@/hooks/useFirmarUrlEntregable";
import TipoEntregableIcon from "@/components/entregables/TipoEntregableIcon";
import type { Entregable } from "@/hooks/useEntregablesEngagement";

interface Props {
  entregable: Entregable;
}

const ChipEntregable = ({ entregable }: Props) => {
  const { firmar } = useFirmarUrlEntregable();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      let url = entregable.url_externa;
      if (!url) url = await firmar(entregable.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo abrir el archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 font-body text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      aria-label={`Abrir ${entregable.nombre}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : entregable.url_externa ? (
        <ExternalLink className="h-3 w-3 shrink-0" />
      ) : (
        <TipoEntregableIcon tipo={entregable.tipo} size={12} />
      )}
      <span className="truncate">{entregable.nombre}</span>
    </button>
  );
};

export default ChipEntregable;
