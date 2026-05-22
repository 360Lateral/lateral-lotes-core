import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PortalProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, roles, userType, isAdminOrAsesor, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin/asesor/super_admin → dashboard interno
  if (isAdminOrAsesor) {
    return <Navigate to="/dashboard" replace />;
  }

  const isInversor =
    roles.includes("inversor") || userType === "inversor";

  if (!isInversor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PortalProtectedRoute;
