import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDevRole } from "@/contexts/DevRoleContext";

type AppRole =
  | "super_admin"
  | "admin"
  | "experto"
  | "propietario"
  | "desarrollador"
  | "comisionista"
  | "dueno"; // deprecated, kept for backwards-compat reads

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  userType: string | null;
  loading: boolean;
  // Canonical (new) flags
  isAdminOrExperto: boolean;
  isDesarrollador: boolean;
  isSuperAdmin: boolean;
  isPropietario: boolean;
  isComisionista: boolean;
  // Backwards-compatible aliases — DO NOT USE in new code
  isAdminOrAsesor: boolean;
  isDeveloper: boolean;
  isInversor: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  userType: null,
  loading: true,
  isAdminOrExperto: false,
  isDesarrollador: false,
  isSuperAdmin: false,
  isPropietario: false,
  isComisionista: false,
  isAdminOrAsesor: false,
  isDeveloper: false,
  isInversor: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data && mountedRef.current) {
      setRoles(data.map((r) => r.role as AppRole));
    }
  };

  const fetchUserType = async (userId: string) => {
    const { data } = await supabase
      .from("perfiles")
      .select("user_type")
      .eq("id", userId)
      .single();
    if (data && mountedRef.current) {
      setUserType((data as any).user_type ?? null);
    } else if (mountedRef.current) {
      await supabase
        .from("perfiles")
        .upsert({ id: userId, user_type: null })
        .eq("id", userId);
    }
  };

  const applySession = useCallback(async (newSession: Session | null) => {
    const newUserId = newSession?.user?.id ?? null;

    if (newUserId === lastUserIdRef.current && !loading) {
      return;
    }
    lastUserIdRef.current = newUserId;

    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await Promise.all([
          fetchRoles(newSession.user.id),
          fetchUserType(newSession.user.id),
        ]);
      } else {
        setRoles([]);
        setUserType(null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mountedRef.current) {
        applySession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setTimeout(() => {
          if (mountedRef.current) {
            lastUserIdRef.current = null;
            applySession(newSession);
          }
        }, 0);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const { devRole, isSimulating } = useDevRole();
  const isRealSuperAdmin = roles.includes("super_admin");
  const canSimulate = isRealSuperAdmin && isSimulating;

  const effectiveRoles: AppRole[] = canSimulate
    ? ([devRole] as AppRole[]).filter((r) => (r as string) !== "none")
    : roles;

  const effectiveUserType: string | null = canSimulate
    ? (["desarrollador", "propietario", "comisionista"].includes(devRole) ? devRole : userType)
    : userType;

  const isAdminOrExperto = effectiveRoles.some((r) =>
    ["super_admin", "admin", "experto"].includes(r as string)
  );

  // userType can be 'propietario' (new) or legacy 'dueno' until full migration
  const isPropietario =
    effectiveRoles.includes("propietario") ||
    effectiveUserType === "propietario" ||
    effectiveUserType === "dueno";

  const isDesarrollador =
    effectiveRoles.some((r) => r === "desarrollador") ||
    effectiveUserType === "desarrollador";

  const isSuperAdmin = effectiveRoles.includes("super_admin");
  const isComisionista =
    effectiveRoles.includes("comisionista") || effectiveUserType === "comisionista";

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Force local cleanup even if server call fails
    }
    setSession(null);
    setUser(null);
    setRoles([]);
    setUserType(null);
    lastUserIdRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles: effectiveRoles,
        userType: effectiveUserType,
        loading,
        isAdminOrExperto,
        isDesarrollador,
        isSuperAdmin,
        isPropietario,
        isComisionista,
        // Aliases (deprecated)
        isAdminOrAsesor: isAdminOrExperto,
        isDeveloper: isDesarrollador,
        isInversor: isPropietario,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
