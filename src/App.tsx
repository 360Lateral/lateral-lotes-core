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
            <Route path="/diagnostico" element={<Diagnostico />} />

            {/* Rutas protegidas — solo admin/asesor/super_admin */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/lotes" element={<ProtectedRoute><DashboardLotes /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/nuevo" element={<ProtectedRoute><DashboardLoteNuevo /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/editar" element={<ProtectedRoute><DashboardLoteEditar /></ProtectedRoute>} />
            <Route path="/dashboard/lotes/:id/docs" element={<ProtectedRoute><DashboardLoteDocs /></ProtectedRoute>} />
            <Route path="/dashboard/leads" element={<ProtectedRoute><DashboardLeads /></ProtectedRoute>} />

            {/* Rutas developer */}
            <Route path="/dashboard/developer" element={<ProtectedRoute requireDeveloper><DashboardDeveloper /></ProtectedRoute>} />
            <Route path="/dashboard/notificaciones" element={<ProtectedRoute requireDeveloper><DashboardNotificaciones /></ProtectedRoute>} />

            {/* Negociaciones */}
            <Route path="/negociacion/:id" element={<ProtectedRoute><SalaNegociacion /></ProtectedRoute>} />
            <Route path="/dashboard/negociaciones" element={<ProtectedRoute><DashboardNegociaciones /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
