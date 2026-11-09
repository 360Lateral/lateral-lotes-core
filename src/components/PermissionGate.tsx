import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermisosAcciones, type PermisoAccion } from "@/hooks/usePermisosAcciones";

export default function PermissionGate({ permiso, children, permitirVisitante = false }: {
  permiso: PermisoAccion;
  children: ReactNode;
  permitirVisitante?: boolean;
}) {
  const { user, loading } = useAuth();
  const { permite } = usePermisosAcciones();
  if (loading || (!user ? !permitirVisitante : !permite(permiso))) return null;
  return <>{children}</>;
}