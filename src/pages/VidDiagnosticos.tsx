import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PortalClienteLayout from "@/components/portal/PortalClienteLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VidPortafolio from "@/components/vid/VidPortafolio";
import VidFicha from "@/components/vid/VidFicha";
import VidImportacion from "@/components/vid/VidImportacion";

const Encabezado = () => (
  <header className="mb-5">
    <h1 className="font-display text-2xl md:text-3xl font-semibold">Diagnósticos Fundación Organización VID</h1>
    <p className="text-sm text-muted-foreground mt-1">Resultados de los diagnósticos de cada activo, con hallazgos y plan de acción.</p>
  </header>
);

/** Vista del equipo (admin/experto): portafolio, ficha editable e importación. */
export const VidDiagnosticosEquipo = () => (
  <DashboardLayout>
    <div className="p-4 md:p-6 max-w-6xl">
      <Routes>
        <Route index element={
          <>
            <Encabezado />
            <Tabs defaultValue="portafolio">
              <TabsList className="mb-4">
                <TabsTrigger value="portafolio" className="min-h-10">Portafolio</TabsTrigger>
                <TabsTrigger value="importacion" className="min-h-10">Importación</TabsTrigger>
              </TabsList>
              <TabsContent value="portafolio"><VidPortafolio basePath="/dashboard/vid" esEquipo /></TabsContent>
              <TabsContent value="importacion"><VidImportacion /></TabsContent>
            </Tabs>
          </>
        } />
        <Route path=":codigo" element={<VidFicha basePath="/dashboard/vid" esEquipo />} />
      </Routes>
    </div>
  </DashboardLayout>
);

/** Vista del cliente VID (propietario): solo lectura. */
export const VidDiagnosticosCliente = () => (
  <PortalClienteLayout>
    <Routes>
      <Route index element={<><Encabezado /><VidPortafolio basePath="/portal/diagnosticos" esEquipo={false} /></>} />
      <Route path=":codigo" element={<VidFicha basePath="/portal/diagnosticos" esEquipo={false} />} />
    </Routes>
  </PortalClienteLayout>
);
