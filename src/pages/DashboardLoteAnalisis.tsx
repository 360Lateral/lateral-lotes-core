import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ExcelAnalisisImporter from "@/components/ExcelAnalisisImporter";
import ExcelAnalisisExporter from "@/components/ExcelAnalisisExporter";
import { AnalisisCard } from "@/components/analisis/AnalisisCard";
import { useAnalisisUnificado } from "@/hooks/useAnalisisUnificado";
import { useEngagementVigenteDeLote } from "@/hooks/useEngagementVigenteDeLote";
import { usePdfExtractAnalisis } from "@/hooks/analisis/usePdfExtractAnalisis";
import SeccionNormativa from "@/components/analisis/editor/SeccionNormativa";
import SeccionJuridico from "@/components/analisis/editor/SeccionJuridico";
import SeccionAmbiental from "@/components/analisis/editor/SeccionAmbiental";
import SeccionSspp from "@/components/analisis/editor/SeccionSspp";
import SeccionGeotecnico from "@/components/analisis/editor/SeccionGeotecnico";
import SeccionMercado from "@/components/analisis/editor/SeccionMercado";
import SeccionArquitectonico from "@/components/analisis/editor/SeccionArquitectonico";
import SeccionFinanciero from "@/components/analisis/editor/SeccionFinanciero";

const DashboardLoteAnalisis = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: lote, isLoading: loadingLote } = useQuery({
    queryKey: ["analisis-lote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("nombre_lote, ciudad, area_total_m2, lat, lng")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: engagementVigente } = useEngagementVigenteDeLote(id);
  const { data: dimensiones } = useAnalisisUnificado(id, engagementVigente?.id);

  const pdfBase = usePdfExtractAnalisis(lote);

  const scrollToSection = (tipoCodigo: string) => {
    const el = document.getElementById(`section-${tipoCodigo}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(
        () => el.classList.remove("ring-2", "ring-primary", "ring-offset-2"),
        1800,
      );
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get("tipo");
    if (tipo && dimensiones && dimensiones.length > 0) {
      setTimeout(() => scrollToSection(tipo), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensiones]);

  if (loadingLote) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Link
        to="/dashboard/lotes"
        className="mb-4 inline-flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a lotes
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-foreground">
          Editor de Análisis 360° — {lote?.nombre_lote ?? "Lote"}
        </h1>

        <div className="flex items-center gap-2">
          <ExcelAnalisisExporter loteId={id!} />
          <ExcelAnalisisImporter loteId={id!} loteName={lote?.nombre_lote} />
        </div>
      </div>

      {engagementVigente && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-foreground">
            Este lote tiene un engagement activo{" "}
            <Link
              to={`/dashboard/engagements/${engagementVigente.id}`}
              className="font-semibold text-primary hover:underline"
            >
              #{engagementVigente.id.slice(0, 8)}
            </Link>
            . Los cambios aquí actualizan el progreso del engagement automáticamente.
          </p>
        </div>
      )}

      {dimensiones && dimensiones.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dimensiones.map((d) => (
            <AnalisisCard
              key={d.tipo_codigo}
              dimension={d}
              onEditar={() => scrollToSection(d.tipo_codigo)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div id="section-normativo">
          <SeccionNormativa
            loteId={id!}
            lat={lote?.lat}
            lng={lote?.lng}
            pdfProps={pdfBase.makePdfProps("normativo")}
          />
        </div>
        <div id="section-juridico">
          <SeccionJuridico loteId={id!} pdfProps={pdfBase.makePdfProps("juridico")} />
        </div>
        <div id="section-ambiental">
          <SeccionAmbiental loteId={id!} pdfProps={pdfBase.makePdfProps("ambiental")} />
        </div>
        <div id="section-sspp">
          <SeccionSspp loteId={id!} pdfProps={pdfBase.makePdfProps("sspp")} />
        </div>
        <div id="section-geotecnico">
          <SeccionGeotecnico loteId={id!} pdfProps={pdfBase.makePdfProps("geotecnico")} />
        </div>
        <div id="section-mercado">
          <SeccionMercado loteId={id!} pdfProps={pdfBase.makePdfProps("mercado")} />
        </div>
        <div id="section-arquitectonico">
          <SeccionArquitectonico
            loteId={id!}
            pdfProps={pdfBase.makePdfProps("arquitectonico")}
          />
        </div>
        <div id="section-financiero">
          <SeccionFinanciero
            loteId={id!}
            pdfProps={pdfBase.makePdfProps("financiero")}
          />
        </div>
      </div>

      {pdfBase.extractedCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => {
              pdfBase.resetExtracted();
              toast({
                title: "Datos aplicados",
                description:
                  "Los datos fueron cargados en cada sección. Revisa y guarda.",
              });
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
          >
            Aplicar {pdfBase.extractedCount} área(s) y limpiar sugerencias
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardLoteAnalisis;
