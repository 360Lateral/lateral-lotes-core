import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requireDeveloper?: boolean;
}

const ProtectedRoute = ({ children, requireDeveloper }: Props) => {
  const { user, isAdminOrAsesor, isDeveloper, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-body">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireDeveloper && !isDeveloper && !isAdminOrAsesor) {
    return <Navigate to="/lotes" replace />;
  }

  if (!requireDeveloper && !isAdminOrAsesor && !isDeveloper) {
    return <Navigate to="/lotes" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
