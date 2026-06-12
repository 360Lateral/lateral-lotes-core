import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, Paperclip } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import TipoEntregableIcon from "@/components/entregables/TipoEntregableIcon";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";
import { useDescargarEntregable } from "@/hooks/cliente/useDescargarEntregable";
import { toast } from "@/hooks/use-toast";

export interface AreaAcordeon {
  key: string;
  label: string;
  icon: LucideIcon;
  score?: number | null;
  estado: "listo" | "en_revision" | "pendiente";
  entregables: Array<{ id: string; nombre: string; tipo: string; tiene_url_externa?: boolean }>;
}

interface Props {
  areas: AreaAcordeon[];
  totalListos?: number;
  total?: number;
}

const estadoBadge = (estado: AreaAcordeon["estado"]) => {
  if (estado === "listo")
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Listo</Badge>;
  if (estado === "en_revision")
    return <Badge className="bg-amber-500 text-white hover:bg-amber-500">En revisión</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
};

const ChipEntregable = ({
  ent,
}: {
  ent: { id: string; nombre: string; tipo: string; tiene_url_externa?: boolean };
}) => {
  const { descargar } = useDescargarEntregable();
  const [loading, setLoading] = useState(false);
  const abrir = async () => {
    setLoading(true);
    try {
      const url = await descargar(ent.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({
        title: "No pudimos abrir el archivo",
        description: e?.message || "Intenta de nuevo en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={abrir}
      disabled={loading}
      className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      ) : ent.tiene_url_externa ? (
        <ExternalLink className="h-3 w-3 shrink-0" />
      ) : (
        <TipoEntregableIcon tipo={ent.tipo as TipoEntregable} size={12} />
      )}
      <span className="truncate">{ent.nombre}</span>
    </button>
  );
};

const AnalisisPorAreaAcordeon = ({ areas, totalListos, total }: Props) => {
  if (areas.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Análisis por área</h2>
        {total != null && totalListos != null && (
          <span className="text-sm text-muted-foreground">
            {totalListos} de {total} listas
          </span>
        )}
      </div>
      <Accordion type="multiple" className="space-y-2">
        {areas.map((a) => {
          const Icon = a.icon;
          const iconBg =
            a.estado === "listo"
              ? "bg-emerald-50 text-emerald-700"
              : a.estado === "en_revision"
                ? "bg-amber-50 text-amber-700"
                : "bg-muted text-muted-foreground";
          return (
            <AccordionItem
              key={a.key}
              value={a.key}
              className="rounded-lg border border-border bg-card px-3"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center gap-3 pr-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium">{a.label}</span>
                  <div className="flex items-center gap-2">
                    {a.score != null && a.estado === "listo" && (
                      <Badge variant="outline" className="text-[11px]">
                        Score {a.score.toFixed(1)}
                      </Badge>
                    )}
                    {estadoBadge(a.estado)}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {a.entregables.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pl-12">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    {a.entregables.map((e) => (
                      <ChipEntregable key={e.id} ent={e} />
                    ))}
                  </div>
                ) : (
                  <p className="pl-12 text-xs text-muted-foreground">
                    Aún no hay entregables en esta área.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default AnalisisPorAreaAcordeon;
