import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requireDeveloper?: boolean;
  allowOwner?: boolean;
}

const ProtectedRoute = ({ children, requireDeveloper, allowOwner }: Props) => {
  const { user, isAdminOrAsesor, isDeveloper, userType, loading } = useAuth();

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

  const isOwner = userType === "dueno" || userType === "comisionista";

  if (requireDeveloper && !isDeveloper && !isAdminOrAsesor) {
    return <Navigate to="/lotes" replace />;
  }

  if (allowOwner && isOwner) {
    return <>{children}</>;
  }

  if (!requireDeveloper && !isAdminOrAsesor && !isDeveloper && !isOwner) {
    return <Navigate to="/bienvenida" replace />;
  }

  // Owners without allowOwner on admin-only routes
  if (!requireDeveloper && !allowOwner && isOwner && !isAdminOrAsesor) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
