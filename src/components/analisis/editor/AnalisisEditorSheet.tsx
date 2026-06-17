import { lazy, Suspense } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { PdfExtractContext } from "@/hooks/analisis/usePdfExtractAnalisis";

const SeccionNormativa = lazy(() => import("./SeccionNormativa"));
const SeccionJuridico = lazy(() => import("./SeccionJuridico"));
const SeccionAmbiental = lazy(() => import("./SeccionAmbiental"));
const SeccionSspp = lazy(() => import("./SeccionSspp"));
const SeccionGeotecnico = lazy(() => import("./SeccionGeotecnico"));
const SeccionMercado = lazy(() => import("./SeccionMercado"));
const SeccionArquitectonico = lazy(() => import("./SeccionArquitectonico"));
const SeccionFinanciero = lazy(() => import("./SeccionFinanciero"));

const COMPONENTE_POR_CODIGO: Record<string, any> = {
  normativo: SeccionNormativa,
  juridico: SeccionJuridico,
  ambiental: SeccionAmbiental,
  sspp: SeccionSspp,
  geotecnico: SeccionGeotecnico,
  mercado: SeccionMercado,
  arquitectonico: SeccionArquitectonico,
  financiero: SeccionFinanciero,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loteId: string;
  lat?: number | null;
  lng?: number | null;
  pdfBase: PdfExtractContext;
  codigoArea: string;
  nombreArea: string;
  onSaved?: () => void;
}

function EditorSkeleton() {
  return (
    <div className="space-y-3 pt-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  );
}

export default function AnalisisEditorSheet({
  open,
  onOpenChange,
  loteId,
  lat,
  lng,
  pdfBase,
  codigoArea,
  nombreArea,
  onSaved,
}: Props) {
  const Componente = COMPONENTE_POR_CODIGO[codigoArea];

  // Cada sección usa una queryKey distinta; al guardar disparamos onSaved
  // para que el grid invalide su agregado.
  const seccionExtra: Record<string, any> = {};
  if (codigoArea === "normativo") {
    seccionExtra.lat = lat;
    seccionExtra.lng = lng;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Editar análisis: {nombreArea}</SheetTitle>
          <SheetDescription>
            Captura estructurada de datos. Los cambios se guardan al usar el
            botón Guardar de la sección y refrescan el grid al cerrar.
          </SheetDescription>
        </SheetHeader>

        {Componente ? (
          <Suspense fallback={<EditorSkeleton />}>
            <Componente
              loteId={loteId}
              pdfProps={pdfBase.makePdfProps(codigoArea)}
              defaultOpen
              onSaved={onSaved}
              {...seccionExtra}
            />
          </Suspense>
        ) : (
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <p className="font-body text-sm text-muted-foreground">
              El análisis "{nombreArea}" no tiene editor estructurado. Usa el
              importador de Excel desde el resumen del engagement.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
