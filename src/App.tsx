import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

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
import Bienvenida from "./pages/Bienvenida";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/lotes/:id" element={<LoteDetalle />} />
            <Route path="/login" element={<Login />} />
            <Route path="/bienvenida" element={<Bienvenida />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route path="/diagnostico/resultado" element={<DiagnosticoResultado />} />
            <Route path="/mercado" element={<Mercado />} />
            <Route path="/resolutoria" element={<Resolutoria />} />
            <Route path="/planes" element={<Planes />} />

            {/* Rutas protegidas — solo admin/asesor/super_admin */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/lotes" element={<ProtectedRoute><DashboardLotes /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/nuevo" element={<ProtectedRoute allowOwner><DashboardLoteNuevo /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/importar" element={<ProtectedRoute><DashboardLotesImportar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/editar" element={<ProtectedRoute><DashboardLoteEditar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/docs" element={<ProtectedRoute><DashboardLoteDocs /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardLeads /></ProtectedRoute>} />
            <Route path="/dashboard/usuarios" element={<ProtectedRoute><DashboardUsuarios /></ProtectedRoute>} />

            {/* Rutas developer */}
            <Route path="/dashboard/developer" element={<ProtectedRoute requireDeveloper><DashboardDeveloper /></ProtectedRoute>} />
            <Route path="/dashboard/notificaciones" element={<ProtectedRoute requireDeveloper><DashboardNotificaciones /></ProtectedRoute>} />

            {/* Negociaciones */}
            <Route path="/negociacion/:id" element={<ProtectedRoute><SalaNegociacion /></ProtectedRoute>} />
            <Route path="/dashboard/negociaciones" element={<ProtectedRoute><DashboardNegociaciones /></ProtectedRoute>} />
            <Route path="/dashboard/owner" element={<ProtectedRoute allowOwner><DashboardOwner /></ProtectedRoute>} />
            <Route path="/dashboard/owner/lotes" element={<ProtectedRoute allowOwner><DashboardOwnerLotes /></ProtectedRoute>} />
            <Route path="/dashboard/owner/diagnosticos" element={<ProtectedRoute allowOwner><DashboardOwnerDiagnosticos /></ProtectedRoute>} />
            <Route path="/dashboard/owner/negociaciones" element={<ProtectedRoute allowOwner><DashboardOwnerNegociaciones /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
