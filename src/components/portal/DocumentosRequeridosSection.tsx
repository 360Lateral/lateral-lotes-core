import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";
import UploadDocumentoCliente from "./UploadDocumentoCliente";
import { useDocsEngagementCliente } from "@/hooks/portal/useDocsEngagementCliente";

interface Props {
  engagementId: string;
  planId: string | undefined;
}

const DocumentosRequeridosSection = ({ engagementId, planId }: Props) => {
  const { data, isLoading } = useDocsEngagementCliente(engagementId, planId);

  if (!planId) return null;

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  // Nada en catálogo y nada subido → ocultar sección (el equipo aún no configura)
  if (!data || (data.pendientes.length === 0 && data.subidos.length === 0)) {
    return null;
  }

  const { pendientes, subidos, subidosPorRequerido } = data;
  const requeridosCompletos = pendientes.length === 0 && subidos.length > 0;

  return (
    <Card
      className={
        pendientes.length > 0
          ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
          : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      }
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          {pendientes.length > 0 ? (
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">
              {pendientes.length > 0
                ? `Necesitamos ${pendientes.length} documento${pendientes.length === 1 ? "" : "s"} de tu parte`
                : "Documentación al día"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pendientes.length > 0
                ? "Para continuar con tu análisis, sube los siguientes documentos:"
                : requeridosCompletos
                  ? "Ya recibimos todo lo necesario. Si pedimos algo más, te avisamos."
                  : "Documentos compartidos contigo:"}
            </p>
          </div>
        </div>

        {pendientes.length > 0 && (
          <ul className="space-y-2">
            {pendientes.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-3 rounded-md bg-background/80 border p-3"
              >
                <FileText className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{doc.nombre}</span>
                    {doc.opcional && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        Opcional
                      </Badge>
                    )}
                  </div>
                  {doc.descripcion && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.descripcion}
                    </p>
                  )}
                </div>
                <UploadDocumentoCliente
                  engagementId={engagementId}
                  requeridoId={doc.id}
                />
              </li>
            ))}
          </ul>
        )}

        {subidos.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Ya recibidos ({subidos.length})
            </p>
            <ul className="space-y-1.5">
              {subidos.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate flex-1">{s.archivo_nombre}</span>
                  {s.estado_validacion === "aprobado" && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-emerald-300 text-emerald-700">
                      Validado
                    </Badge>
                  )}
                  {s.estado_validacion === "rechazado" && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                      Rechazado
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentosRequeridosSection;
