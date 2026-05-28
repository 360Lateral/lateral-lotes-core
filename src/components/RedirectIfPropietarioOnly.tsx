import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Si el usuario es SOLO propietario (no tiene rol admin/super_admin/experto),
 * lo redirige al portal. Útil para deprecar rutas legacy /dashboard/owner/* que
 * antes eran su home pero que ahora se sustituyen por /portal.
 */
const RedirectIfPropietarioOnly = ({ children, redirectTo = "/portal" }: Props) => {
  const { isPropietario, isAdminOrExperto, loading } = useAuth();

  if (loading) return null;

  if (isPropietario && !isAdminOrExperto) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RedirectIfPropietarioOnly;
