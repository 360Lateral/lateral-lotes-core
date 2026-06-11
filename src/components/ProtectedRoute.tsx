import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Guards de routing:
 * - requireSuperAdmin: solo super_admin.
 * - requireAdmin: super_admin o admin (NO experto, NO desarrollador, NO propietario).
 * - requireDesarrollador: rol desarrollador (admin/experto también pasan para soporte).
 * - requireDeveloper: legacy (DevRoleContext), equivalente a desarrollador con fallback a admin/experto.
 * - allowPropietario / allowOwner (deprecated): permite propietario/comisionista además del default admin/experto.
 * - sin ningún flag: admin/experto. Propietario y comisionista se redirigen a su portal natural.
 *   Desarrollador puro se redirige a /mercado.
 */
interface Props {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  requireAdmin?: boolean;
  requireDesarrollador?: boolean;
  requireDeveloper?: boolean;
  /** @deprecated Usar allowPropietario en su lugar */
  allowOwner?: boolean;
  allowPropietario?: boolean;
  /** Permite que un usuario con rol comisionista entre sin redirect (evita bucles en /comisionista). */
  allowComisionista?: boolean;
}

const ProtectedRoute = ({
  children,
  requireSuperAdmin,
  requireAdmin,
  requireDesarrollador,
  requireDeveloper,
  allowOwner,
  allowPropietario,
  allowComisionista,
}: Props) => {
  const {
    user,
    roles,
    isAdminOrExperto,
    isDesarrollador,
    isPropietario,
    isComisionista,
    isSuperAdmin,
    loading,
  } = useAuth();

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

  const isAdmin = isSuperAdmin || roles.includes("admin");
  const isExperto = roles.includes("experto");
  const isOwnerLike = isPropietario || isComisionista;
  const allowsOwner = allowPropietario ?? allowOwner ?? false;

  const contextualRedirect = (): string => {
    if (isAdmin || isExperto) return "/dashboard";
    if (isPropietario) return "/portal";
    if (isComisionista) return "/comisionista";
    if (isDesarrollador) return "/mercado";
    if (isExperto) return "/dashboard/mis-ordenes";
    return "/bienvenida";
  };

  if (requireSuperAdmin) {
    if (!isSuperAdmin) {
      console.warn("[ProtectedRoute] requireSuperAdmin → redirect /dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  if (requireAdmin) {
    if (!(isAdmin || isSuperAdmin)) {
      let target = "/bienvenida";
      if (isPropietario) target = "/portal";
      else if (isComisionista) target = "/comisionista";
      else if (isDesarrollador) target = "/mercado";
      else if (isExperto) target = "/dashboard/mis-ordenes";
      console.warn(`[ProtectedRoute] requireAdmin → redirect ${target}`);
      return <Navigate to={target} replace />;
    }
    return <>{children}</>;
  }

  if (requireDesarrollador) {
    if (!isDesarrollador && !isAdminOrExperto) {
      console.warn("[ProtectedRoute] requireDesarrollador → redirect /bienvenida");
      return <Navigate to="/bienvenida" replace />;
    }
    return <>{children}</>;
  }

  if (requireDeveloper) {
    if (!isDesarrollador && !isAdminOrExperto) {
      console.warn("[ProtectedRoute] requireDeveloper → redirect /lotes");
      return <Navigate to="/lotes" replace />;
    }
    return <>{children}</>;
  }

  // Default: admin/experto pasan. Propietarios/comisionistas si allow*. Desarrollador puro → /mercado.
  if (isAdminOrExperto) {
    return <>{children}</>;
  }

  if (isOwnerLike) {
    if (allowsOwner) return <>{children}</>;
    if (isComisionista && allowComisionista) return <>{children}</>;
    const target = isComisionista ? "/comisionista" : "/portal";
    console.warn(`[ProtectedRoute] owner sin allow → redirect ${target}`);
    return <Navigate to={target} replace />;
  }

  if (isDesarrollador) {
    console.warn("[ProtectedRoute] desarrollador puro en ruta admin → redirect /mercado");
    return <Navigate to="/mercado" replace />;
  }

  console.warn("[ProtectedRoute] sin rol válido → redirect /bienvenida");
  return <Navigate to="/bienvenida" replace />;
};

export default ProtectedRoute;
