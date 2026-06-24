import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import PageLoadingFallback from "@/components/PageLoadingFallback";

// Eager: landing, auth y rutas críticas de primera carga
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy: resto del árbol — reduce bundle inicial
const Lotes = lazy(() => import("./pages/Lotes"));
const LoteDetalle = lazy(() => import("./pages/LoteDetalle"));
const LoteFicha = lazy(() => import("./pages/LoteFicha"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardLoteNuevo = lazy(() => import("./pages/DashboardLoteNuevo"));
const DashboardLotesImportar = lazy(() => import("./pages/DashboardLotesImportar"));
const DashboardLoteEditar = lazy(() => import("./pages/DashboardLoteEditar"));
const DashboardLoteDocs = lazy(() => import("./pages/DashboardLoteDocs"));
const DashboardDeveloper = lazy(() => import("./pages/DashboardDeveloper"));
const DashboardNotificaciones = lazy(() => import("./pages/DashboardNotificaciones"));
const DashboardNegociaciones = lazy(() => import("./pages/DashboardNegociaciones"));
const SalaNegociacion = lazy(() => import("./pages/SalaNegociacion"));
const Diagnostico = lazy(() => import("./pages/Diagnostico"));
const DiagnosticoResultado = lazy(() => import("./pages/DiagnosticoResultado"));
const Mercado = lazy(() => import("./pages/Mercado"));
const Resolutoria = lazy(() => import("./pages/Resolutoria"));
const Planes = lazy(() => import("./pages/Planes"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const DashboardOwner = lazy(() => import("./pages/DashboardOwner"));
const DashboardOwnerLotes = lazy(() => import("./pages/DashboardOwnerLotes"));
const DashboardOwnerDiagnosticos = lazy(() => import("./pages/DashboardOwnerDiagnosticos"));
const DashboardOwnerNegociaciones = lazy(() => import("./pages/DashboardOwnerNegociaciones"));
const DashboardUsuarios = lazy(() => import("./pages/DashboardUsuarios"));
const RedirectLoteAnalisisAEngagement = lazy(() => import("./pages/RedirectLoteAnalisisAEngagement"));
const DashboardConfig = lazy(() => import("./pages/DashboardConfig"));
const PortafolioDashboard = lazy(() => import("./pages/PortafolioDashboard"));
const EngagementDetalle = lazy(() => import("./pages/EngagementDetalle"));
const DashboardImportarEngagement = lazy(() => import("./pages/DashboardImportarEngagement"));
const DashboardLotesPendientesValidacion = lazy(() => import("./pages/DashboardLotesPendientesValidacion"));
const DashboardSolicitudesContacto = lazy(() => import("./pages/DashboardSolicitudesContacto"));
const MetricasEjecutivas = lazy(() => import("./pages/MetricasEjecutivas"));
const Bienvenida = lazy(() => import("./pages/Bienvenida"));
const PreferenciasUsuario = lazy(() => import("./pages/PreferenciasUsuario"));
const MisEngagements = lazy(() => import("./pages/portal/MisEngagements"));
const EngagementClienteDetalle = lazy(() => import("./pages/portal/EngagementClienteDetalle"));
const PortalProtectedRoute = lazy(() => import("@/components/portal/PortalProtectedRoute"));
const RecuperarContrasena = lazy(() => import("./pages/RecuperarContrasena"));
const RestablecerContrasena = lazy(() => import("./pages/RestablecerContrasena"));
const DashboardContratosMarco = lazy(() => import("./pages/DashboardContratosMarco"));
const DashboardOrdenesServicio = lazy(() => import("./pages/DashboardOrdenesServicio"));
const DashboardMisOrdenes = lazy(() => import("./pages/DashboardMisOrdenes"));
const DashboardMetricasExpertos = lazy(() => import("./pages/DashboardMetricasExpertos"));
const DashboardOrdenServicioDetalle = lazy(() => import("./pages/DashboardOrdenServicioDetalle"));
const PagoCompletado = lazy(() => import("./pages/PagoCompletado"));
const DashboardPagos = lazy(() => import("./pages/DashboardPagos"));
const DashboardLiquidaciones = lazy(() => import("./pages/DashboardLiquidaciones"));
const DashboardVentas = lazy(() => import("./pages/DashboardVentas"));
const ComisionistaPortal = lazy(() => import("./pages/ComisionistaPortal"));
const DashboardFinanzas = lazy(() => import("./pages/DashboardFinanzas"));
const Suscripcion = lazy(() => import("./pages/Suscripcion"));
const MiCuentaDesarrollador = lazy(() => import("./pages/MiCuentaDesarrollador"));
const DashboardSuscripciones = lazy(() => import("./pages/DashboardSuscripciones"));
const DashboardConfigSuscripciones = lazy(() => import("./pages/DashboardConfigSuscripciones"));
const DashboardAcuerdosFirmados = lazy(() => import("./pages/DashboardAcuerdosFirmados"));
const DashboardFeedback = lazy(() => import("./pages/DashboardFeedback"));
const MisFeedback = lazy(() => import("./pages/MisFeedback"));
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

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
            <FeedbackWidget />
            <Suspense fallback={<PageLoadingFallback />}>
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
            <Route path="/suscripcion" element={<ProtectedRoute requireDesarrollador><Suscripcion /></ProtectedRoute>} />
            <Route path="/mi-cuenta" element={<ProtectedRoute requireDesarrollador><MiCuentaDesarrollador /></ProtectedRoute>} />
            <Route path="/portal/pago-completado" element={<PagoCompletado />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />

            {/* Rutas protegidas — solo admin/asesor/super_admin */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/lotes" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/lotes/nuevo" element={<ProtectedRoute allowPropietario><DashboardLoteNuevo /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/importar" element={<ProtectedRoute requireAdmin><DashboardLotesImportar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/pendientes-validacion" element={<ProtectedRoute requireAdmin><DashboardLotesPendientesValidacion /></ProtectedRoute>} />
            <Route path="/dashboard/solicitudes-contacto" element={<ProtectedRoute requireAdmin><DashboardSolicitudesContacto /></ProtectedRoute>} />
            <Route path="/dashboard/acuerdos-firmados" element={<ProtectedRoute requireAdmin><DashboardAcuerdosFirmados /></ProtectedRoute>} />
            <Route path="/dashboard/feedback" element={<ProtectedRoute requireAdmin><DashboardFeedback /></ProtectedRoute>} />
            <Route path="/feedback/mis-tickets" element={<MisFeedback />} />
            <Route path="/dashboard/lotes/:id/editar" element={<ProtectedRoute><DashboardLoteEditar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/docs" element={<ProtectedRoute><DashboardLoteDocs /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/analisis" element={<ProtectedRoute><RedirectLoteAnalisisAEngagement /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/usuarios" element={<ProtectedRoute requireAdmin><DashboardUsuarios /></ProtectedRoute>} />
            <Route path="/dashboard/config" element={<ProtectedRoute requireSuperAdmin><DashboardConfig /></ProtectedRoute>} />
            <Route path="/dashboard/contratos-marco" element={<ProtectedRoute requireSuperAdmin><DashboardContratosMarco /></ProtectedRoute>} />
            <Route path="/dashboard/ordenes-servicio" element={<ProtectedRoute><DashboardOrdenesServicio /></ProtectedRoute>} />
            <Route path="/dashboard/ordenes-servicio/:id" element={<ProtectedRoute><DashboardOrdenServicioDetalle /></ProtectedRoute>} />
            <Route path="/dashboard/mis-ordenes" element={<ProtectedRoute><DashboardMisOrdenes /></ProtectedRoute>} />
            <Route path="/dashboard/metricas/expertos" element={<ProtectedRoute><DashboardMetricasExpertos /></ProtectedRoute>} />
            <Route path="/dashboard/portafolio" element={<ProtectedRoute><PortafolioDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/engagements/importar" element={<ProtectedRoute requireSuperAdmin><DashboardImportarEngagement /></ProtectedRoute>} />
            <Route path="/dashboard/engagements/:id" element={<ProtectedRoute><EngagementDetalle /></ProtectedRoute>} />
            <Route path="/dashboard/pagos" element={<ProtectedRoute requireAdmin><DashboardPagos /></ProtectedRoute>} />
            <Route path="/dashboard/liquidaciones" element={<ProtectedRoute requireAdmin><DashboardLiquidaciones /></ProtectedRoute>} />
            <Route path="/dashboard/ventas" element={<ProtectedRoute requireAdmin><DashboardVentas /></ProtectedRoute>} />
            <Route path="/dashboard/finanzas" element={<ProtectedRoute requireAdmin><DashboardFinanzas /></ProtectedRoute>} />
            <Route path="/dashboard/suscripciones" element={<ProtectedRoute requireAdmin><DashboardSuscripciones /></ProtectedRoute>} />
            <Route path="/dashboard/config-suscripciones" element={<ProtectedRoute requireSuperAdmin><DashboardConfigSuscripciones /></ProtectedRoute>} />
            <Route path="/dashboard/metricas" element={<ProtectedRoute requireAdmin><MetricasEjecutivas /></ProtectedRoute>} />
            <Route path="/dashboard/preferencias" element={<ProtectedRoute allowPropietario><PreferenciasUsuario /></ProtectedRoute>} />

            {/* Rutas developer */}
            <Route path="/dashboard/developer" element={<ProtectedRoute requireDeveloper><DashboardDeveloper /></ProtectedRoute>} />
            <Route path="/dashboard/notificaciones" element={<ProtectedRoute requireDeveloper><DashboardNotificaciones /></ProtectedRoute>} />

            {/* Negociaciones */}
            <Route path="/negociacion/:id" element={<ProtectedRoute><SalaNegociacion /></ProtectedRoute>} />
            <Route path="/dashboard/negociaciones" element={<ProtectedRoute requireAdmin><DashboardNegociaciones /></ProtectedRoute>} />
            <Route path="/dashboard/owner" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwner /></RedirectIfPropietarioOnly></ProtectedRoute>} />
            <Route path="/dashboard/owner/lotes" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwnerLotes /></RedirectIfPropietarioOnly></ProtectedRoute>} />
            <Route path="/dashboard/owner/diagnosticos" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwnerDiagnosticos /></RedirectIfPropietarioOnly></ProtectedRoute>} />
            <Route path="/dashboard/owner/negociaciones" element={<ProtectedRoute allowPropietario><RedirectIfPropietarioOnly><DashboardOwnerNegociaciones /></RedirectIfPropietarioOnly></ProtectedRoute>} />


            {/* Portal del cliente (rol inversor) */}
            <Route path="/portal" element={<PortalProtectedRoute><MisEngagements /></PortalProtectedRoute>} />
            <Route path="/portal/engagement/:id" element={<PortalProtectedRoute><EngagementClienteDetalle /></PortalProtectedRoute>} />

            {/* Portal del comisionista */}
            <Route path="/comisionista" element={<ProtectedRoute allowComisionista><ComisionistaPortal /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </DevRoleProvider>
  </QueryClientProvider>
);

export default App;
