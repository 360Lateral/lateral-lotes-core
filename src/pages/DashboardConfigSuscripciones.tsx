import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Settings2 } from "lucide-react";
import TabPropietario from "@/components/admin/precios/TabPropietario";
import TabDesarrollador from "@/components/admin/precios/TabDesarrollador";
import TabGeneral from "@/components/admin/precios/TabGeneral";
import DocumentosRequeridosManager from "@/components/admin/DocumentosRequeridosManager";

const DashboardConfigSuscripciones = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Settings2 className="h-5 w-5" /> Precios y planes
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Planes de propietario (pago por lote), suscripciones de desarrollador y configuración general.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
            <AlertCircle className="h-3 w-3" />
            Los cambios solo afectan nuevas compras y suscripciones
          </div>
        </header>

        <Tabs defaultValue="propietario" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="propietario">Propietario</TabsTrigger>
            <TabsTrigger value="desarrollador">Desarrollador</TabsTrigger>
            <TabsTrigger value="docs-requeridos">Documentos requeridos</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="propietario">
            <TabPropietario />
          </TabsContent>
          <TabsContent value="desarrollador">
            <TabDesarrollador />
          </TabsContent>
          <TabsContent value="docs-requeridos">
            <DocumentosRequeridosManager />
          </TabsContent>
          <TabsContent value="general">
            <TabGeneral />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardConfigSuscripciones;
