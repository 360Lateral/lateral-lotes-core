import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DevRoleProvider } from "@/contexts/DevRoleContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RedirectIfPropietarioOnly from "@/components/RedirectIfPropietarioOnly";
import ErrorBoundary from "@/components/ErrorBoundary";
import HomeButton from "@/components/ui/HomeButton";
import DevRoleBanner from "@/components/DevRoleBanner";

import Index from "./pages/Index";
import Lotes from "./pages/Lotes";
import LoteDetalle from "./pages/LoteDetalle";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardLotes from "./pages/DashboardLotes";
import DashboardLoteNuevo from "./pages/DashboardLoteNuevo";
import DashboardLotesImportar from "./pages/DashboardLotesImportar";
import DashboardLoteEditar from "./pages/DashboardLoteEditar";
import DashboardLoteDocs from "./pages/DashboardLoteDocs";
import DashboardLeads from "./pages/DashboardLeads";
import DashboardDeveloper from "./pages/DashboardDeveloper";
import DashboardNotificaciones from "./pages/DashboardNotificaciones";
import DashboardNegociaciones from "./pages/DashboardNegociaciones";
import SalaNegociacion from "./pages/SalaNegociacion";
import Diagnostico from "./pages/Diagnostico";
import DiagnosticoResultado from "./pages/DiagnosticoResultado";
import Mercado from "./pages/Mercado";
import Resolutoria from "./pages/Resolutoria";
import Planes from "./pages/Planes";
import DashboardOwner from "./pages/DashboardOwner";
import DashboardOwnerLotes from "./pages/DashboardOwnerLotes";
import DashboardOwnerDiagnosticos from "./pages/DashboardOwnerDiagnosticos";
import DashboardOwnerNegociaciones from "./pages/DashboardOwnerNegociaciones";
import DashboardUsuarios from "./pages/DashboardUsuarios";
import DashboardLoteAnalisis from "./pages/DashboardLoteAnalisis";
import DashboardConfig from "./pages/DashboardConfig";
import PortafolioDashboard from "./pages/PortafolioDashboard";
import EngagementDetalle from "./pages/EngagementDetalle";
import DashboardImportarEngagement from "./pages/DashboardImportarEngagement";
import DashboardLotesPendientesValidacion from "./pages/DashboardLotesPendientesValidacion";
import DashboardSolicitudesContacto from "./pages/DashboardSolicitudesContacto";
import MetricasEjecutivas from "./pages/MetricasEjecutivas";
import Bienvenida from "./pages/Bienvenida";
import PreferenciasUsuario from "./pages/PreferenciasUsuario";
import NotFound from "./pages/NotFound";
import MisEngagements from "./pages/portal/MisEngagements";
import EngagementClienteDetalle from "./pages/portal/EngagementClienteDetalle";
import PortalProtectedRoute from "@/components/portal/PortalProtectedRoute";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import DashboardContratosMarco from "./pages/DashboardContratosMarco";
import DashboardOrdenesServicio from "./pages/DashboardOrdenesServicio";
import DashboardMisOrdenes from "./pages/DashboardMisOrdenes";
import DashboardMetricasExpertos from "./pages/DashboardMetricasExpertos";
import DashboardOrdenServicioDetalle from "./pages/DashboardOrdenServicioDetalle";
import PagoCompletado from "./pages/PagoCompletado";
import DashboardPagos from "./pages/DashboardPagos";
import DashboardLiquidaciones from "./pages/DashboardLiquidaciones";
import DashboardVentas from "./pages/DashboardVentas";
import LoteFicha from "./pages/LoteFicha";
import ComisionistaPortal from "./pages/ComisionistaPortal";
import DashboardFinanzas from "./pages/DashboardFinanzas";
import Suscripcion from "./pages/Suscripcion";
import MiCuentaDesarrollador from "./pages/MiCuentaDesarrollador";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DevRoleProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
          <BrowserRouter>
            <DevRoleBanner />
            <HomeButton />
            <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/lotes/:id/ficha" element={<LoteFicha />} />
            <Route path="/lotes/:id" element={<LoteDetalle />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
            <Route path="/bienvenida" element={<Bienvenida />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route path="/diagnostico/resultado" element={<DiagnosticoResultado />} />
            <Route path="/mercado" element={<Mercado />} />
            <Route path="/resolutoria" element={<Resolutoria />} />
            <Route path="/planes" element={<Planes />} />
            <Route path="/suscripcion" element={<ProtectedRoute allowPropietario><Suscripcion /></ProtectedRoute>} />
            <Route path="/mi-cuenta" element={<ProtectedRoute allowPropietario><MiCuentaDesarrollador /></ProtectedRoute>} />
            <Route path="/portal/pago-completado" element={<PagoCompletado />} />

            {/* Rutas protegidas — solo admin/asesor/super_admin */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/lotes" element={<ProtectedRoute><DashboardLotes /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/nuevo" element={<ProtectedRoute allowPropietario><DashboardLoteNuevo /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/importar" element={<ProtectedRoute><DashboardLotesImportar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/pendientes-validacion" element={<ProtectedRoute><DashboardLotesPendientesValidacion /></ProtectedRoute>} />
            <Route path="/dashboard/solicitudes-contacto" element={<ProtectedRoute><DashboardSolicitudesContacto /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/editar" element={<ProtectedRoute><DashboardLoteEditar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/docs" element={<ProtectedRoute><DashboardLoteDocs /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/analisis" element={<ProtectedRoute><DashboardLoteAnalisis /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardLeads /></ProtectedRoute>} />
            <Route path="/dashboard/usuarios" element={<ProtectedRoute><DashboardUsuarios /></ProtectedRoute>} />
            <Route path="/dashboard/config" element={<ProtectedRoute requireSuperAdmin><DashboardConfig /></ProtectedRoute>} />
            <Route path="/dashboard/contratos-marco" element={<ProtectedRoute requireSuperAdmin><DashboardContratosMarco /></ProtectedRoute>} />
            <Route path="/dashboard/ordenes-servicio" element={<ProtectedRoute><DashboardOrdenesServicio /></ProtectedRoute>} />
            <Route path="/dashboard/ordenes-servicio/:id" element={<ProtectedRoute><DashboardOrdenServicioDetalle /></ProtectedRoute>} />
            <Route path="/dashboard/mis-ordenes" element={<ProtectedRoute><DashboardMisOrdenes /></ProtectedRoute>} />
            <Route path="/dashboard/metricas/expertos" element={<ProtectedRoute><DashboardMetricasExpertos /></ProtectedRoute>} />
            <Route path="/dashboard/portafolio" element={<ProtectedRoute><PortafolioDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/engagements/importar" element={<ProtectedRoute requireSuperAdmin><DashboardImportarEngagement /></ProtectedRoute>} />
            <Route path="/dashboard/engagements/:id" element={<ProtectedRoute><EngagementDetalle /></ProtectedRoute>} />
            <Route path="/dashboard/pagos" element={<ProtectedRoute><DashboardPagos /></ProtectedRoute>} />
            <Route path="/dashboard/liquidaciones" element={<ProtectedRoute><DashboardLiquidaciones /></ProtectedRoute>} />
            <Route path="/dashboard/ventas" element={<ProtectedRoute><DashboardVentas /></ProtectedRoute>} />
            <Route path="/dashboard/finanzas" element={<ProtectedRoute><DashboardFinanzas /></ProtectedRoute>} />
            <Route path="/dashboard/metricas" element={<ProtectedRoute><MetricasEjecutivas /></ProtectedRoute>} />
            <Route path="/dashboard/preferencias" element={<ProtectedRoute allowPropietario><PreferenciasUsuario /></ProtectedRoute>} />

            {/* Rutas developer */}
            <Route path="/dashboard/developer" element={<ProtectedRoute requireDeveloper><DashboardDeveloper /></ProtectedRoute>} />
            <Route path="/dashboard/notificaciones" element={<ProtectedRoute requireDeveloper><DashboardNotificaciones /></ProtectedRoute>} />

            {/* Negociaciones */}
            <Route path="/negociacion/:id" element={<ProtectedRoute><SalaNegociacion /></ProtectedRoute>} />
            <Route path="/dashboard/negociaciones" element={<ProtectedRoute><DashboardNegociaciones /></ProtectedRoute>} />
            <Route path="/dashboard/owner" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwner /></RedirectIfPropietarioOnly></ProtectedRoute>} />
            <Route path="/dashboard/owner/lotes" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwnerLotes /></RedirectIfPropietarioOnly></ProtectedRoute>} />
            <Route path="/dashboard/owner/diagnosticos" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwnerDiagnosticos /></RedirectIfPropietarioOnly></ProtectedRoute>} />
            <Route path="/dashboard/owner/negociaciones" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwnerNegociaciones /></RedirectIfPropietarioOnly></ProtectedRoute>} />


            {/* Portal del cliente (rol inversor) */}
            <Route path="/portal" element={<PortalProtectedRoute><MisEngagements /></PortalProtectedRoute>} />
            <Route path="/portal/engagement/:id" element={<PortalProtectedRoute><EngagementClienteDetalle /></PortalProtectedRoute>} />

            {/* Portal del comisionista */}
            <Route path="/comisionista" element={<ComisionistaPortal />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </DevRoleProvider>
  </QueryClientProvider>
);

export default App;
