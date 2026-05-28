import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTransaccionDetalle } from "@/hooks/useTransaccionDetalle";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaccionId: string | undefined;
}

const formatCOP = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

const formatFecha = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("es-CO") : "—";

export const estadoBadgeVariant = (estado: string): { className: string; label: string } => {
  switch (estado) {
    case "aprobada":
      return { className: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300", label: "Aprobada" };
    case "pendiente":
      return { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300", label: "Pendiente" };
    case "declinada":
      return { className: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300", label: "Declinada" };
    case "expirada":
      return { className: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Expirada" };
    case "reembolsada":
      return { className: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300", label: "Reembolsada" };
    case "error":
      return { className: "bg-red-200 text-red-900 dark:bg-red-950/60 dark:text-red-200", label: "Error" };
    default:
      return { className: "bg-muted text-muted-foreground", label: estado };
  }
};

export default function TransaccionDetalleDialog({ open, onOpenChange, transaccionId }: Props) {
  const { data, isLoading } = useTransaccionDetalle(transaccionId);
  const t = data?.transaccion as any;
  const badge = t ? estadoBadgeVariant(t.estado) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalle de transacción
            {badge && <Badge className={badge.className}>{badge.label}</Badge>}
          </DialogTitle>
          {t && (
            <p className="text-xs text-muted-foreground">
              Creada {formatFecha(t.fecha_creacion)}
            </p>
          )}
        </DialogHeader>

        {isLoading || !t ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-5 font-body text-sm">
            {t.error_msg && (
              <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-red-900 dark:bg-red-950/30 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs">{t.error_msg}</p>
              </div>
            )}

            <section>
              <h3 className="mb-2 font-semibold">Datos del cobro</h3>
              <dl className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="text-xs">Lote</dt>
                  <dd className="text-foreground">
                    {t.engagement?.lotes?.nombre_lote ?? "—"}
                    {t.engagement?.lotes?.ciudad ? ` · ${t.engagement.lotes.ciudad}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs">Propietario</dt>
                  <dd className="text-foreground">
                    {t.propietario?.nombre ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {t.propietario?.email ?? ""}
                      {t.propietario?.telefono ? ` · ${t.propietario.telefono}` : ""}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs">Plan</dt>
                  <dd className="text-foreground">
                    {t.plan?.nombre ?? "—"}
                    {t.plan?.precio_smlmv ? ` (${t.plan.precio_smlmv} SMLMV)` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs">Monto</dt>
                  <dd className="text-foreground">{formatCOP(t.monto_cop)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs">SMLMV de referencia</dt>
                  <dd className="text-foreground">
                    {formatCOP(t.smlmv_referencia)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      (snapshot al momento del cobro · {t.monto_smlmv} SMLMV)
                    </span>
                  </dd>
                </div>
              </dl>
            </section>

            <Separator />

            <section>
              <h3 className="mb-2 font-semibold">Datos Wompi</h3>
              <dl className="space-y-1 text-muted-foreground">
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-xs">Reference</dt>
                  <dd className="font-mono text-xs text-foreground">{t.wompi_reference ?? "—"}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-xs">Transaction ID</dt>
                  <dd className="font-mono text-xs text-foreground">{t.wompi_transaction_id ?? "—"}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-xs">Status Wompi</dt>
                  <dd className="font-mono text-xs text-foreground">{t.wompi_status ?? "—"}</dd>
                </div>
                {t.wompi_payment_link_url && (
                  <div className="pt-1">
                    <a
                      href={t.wompi_payment_link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Abrir link de pago <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </dl>
            </section>

            <Separator />

            <section>
              <h3 className="mb-2 font-semibold">Histórico de eventos Wompi</h3>
              {data!.eventos.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sin eventos registrados todavía.
                </p>
              ) : (
                <ol className="space-y-2">
                  {data!.eventos.map((e: any) => {
                    const Icon = e.error_procesamiento ? XCircle : e.procesado ? CheckCircle2 : Clock;
                    const color = e.error_procesamiento
                      ? "text-red-600"
                      : e.procesado
                      ? "text-green-600"
                      : "text-yellow-600";
                    return (
                      <li key={e.id} className="flex gap-3 rounded-md border bg-muted/20 p-2">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                        <div className="flex-1 text-xs">
                          <div className="flex flex-wrap justify-between gap-2">
                            <span className="font-medium text-foreground">{e.tipo_evento}</span>
                            <span className="text-muted-foreground">
                              {formatFecha(e.recibido_en)}
                            </span>
                          </div>
                          {e.procesado_en && (
                            <div className="text-muted-foreground">
                              Procesado: {formatFecha(e.procesado_en)}
                            </div>
                          )}
                          {e.error_procesamiento && (
                            <div className="text-red-600">Error: {e.error_procesamiento}</div>
                          )}
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            {e.evento_id_externo}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
