import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requireDeveloper?: boolean;
  allowOwner?: boolean; // deprecated alias
  allowPropietario?: boolean;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({
  children,
  requireDeveloper,
  allowOwner,
  allowPropietario,
  requireSuperAdmin,
}: Props) => {
  const { user, isAdminOrExperto, isDesarrollador, isPropietario, isComisionista, isSuperAdmin, loading } = useAuth();

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

  if (requireSuperAdmin) {
    if (!isSuperAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  const isOwnerLike = isPropietario || isComisionista;
  const allowsOwner = allowPropietario ?? allowOwner ?? false;

  if (requireDeveloper && !isDesarrollador && !isAdminOrExperto) {
    return <Navigate to="/lotes" replace />;
  }

  if (allowsOwner && isOwnerLike) {
    return <>{children}</>;
  }

  if (!requireDeveloper && !isAdminOrExperto && !isDesarrollador && !isOwnerLike) {
    return <Navigate to="/bienvenida" replace />;
  }

  // Owners on admin-only routes
  if (!requireDeveloper && !allowsOwner && isOwnerLike && !isAdminOrExperto) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
