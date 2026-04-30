import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDevRole, DevRoleSimulated } from "@/contexts/DevRoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ShieldAlert, X } from "lucide-react";

const ROLE_LABELS: Record<DevRoleSimulated, string> = {
  none: "Sin simulación (mi rol real)",
  super_admin: "Super Admin",
  admin: "Admin",
  asesor: "Asesor",
  developer: "Desarrollador",
  dueno: "Dueño",
  comisionista: "Comisionista",
  inversor: "Inversor",
};

const ROLE_HOME: Record<DevRoleSimulated, string> = {
  none: "/dashboard",
  super_admin: "/dashboard",
  admin: "/dashboard",
  asesor: "/dashboard",
  developer: "/dashboard/developer",
  dueno: "/dashboard/owner",
  comisionista: "/dashboard/owner",
  inversor: "/lotes",
};

const DevRoleBanner = () => {
  const { roles, loading } = useAuth();
  const { devRole, setDevRole, isSimulating } = useDevRole();
  const navigate = useNavigate();

  const isSuperAdmin = roles.includes("super_admin");

  // Auto-redirect cuando cambia el rol simulado
  useEffect(() => {
    if (isSimulating) {
      navigate(ROLE_HOME[devRole], { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devRole]);

  if (loading || !isSuperAdmin) return null;

  return (
    <div
      className={`sticky top-0 z-[60] flex items-center gap-2 border-b px-3 py-1.5 ${
        isSimulating
          ? "bg-primary/15 border-primary/40"
          : "bg-secondary border-secondary-foreground/10"
      }`}
    >
      <ShieldAlert
        className={`h-4 w-4 shrink-0 ${
          isSimulating ? "text-primary" : "text-secondary-foreground/70"
        }`}
      />
      <span className="font-body text-xs font-semibold text-secondary-foreground hidden sm:inline">
        Modo Super Admin · Simular vista como:
      </span>
      <span className="font-body text-xs font-semibold text-secondary-foreground sm:hidden">
        Simular:
      </span>

      <Select value={devRole} onValueChange={(v) => setDevRole(v as DevRoleSimulated)}>
        <SelectTrigger className="h-7 w-[180px] bg-background text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_LABELS) as DevRoleSimulated[]).map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isSimulating && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            setDevRole("none");
            navigate("/dashboard", { replace: true });
          }}
        >
          <X className="h-3 w-3 mr-1" />
          Salir
        </Button>
      )}
    </div>
  );
};

export default DevRoleBanner;
