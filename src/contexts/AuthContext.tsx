import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "admin" | "asesor" | "inversor" | "developer";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  userType: string | null;
  loading: boolean;
  isAdminOrAsesor: boolean;
  isDeveloper: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  userType: null,
  loading: true,
  isAdminOrAsesor: false,
  isDeveloper: false,
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
      // Crear perfil vacío si no existe
      await supabase
        .from("perfiles")
        .upsert({ id: userId, user_type: null })
        .eq("id", userId);
    }

    // Fallback: leer userType desde metadata si sigue null
    if (!(data as any)?.user_type && mountedRef.current) {
      const { data: { user } } = await supabase.auth.getUser();
      const metaType = user?.user_metadata?.perfil;
      if (metaType && mountedRef.current) setUserType(metaType);
    }
  };

  const applySession = async (newSession: Session | null) => {
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
  };

  useEffect(() => {
    mountedRef.current = true;

    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    // Listen for auth changes — keep callback synchronous, defer async work
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Defer to avoid deadlock with Supabase auth internals
        setTimeout(() => {
          if (mountedRef.current) {
            applySession(newSession);
          }
        }, 0);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdminOrAsesor = roles.some((r) =>
    ["super_admin", "admin", "asesor"].includes(r)
  );

  const isDeveloper = userType === "developer" || roles.some((r) => r === "developer");

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, roles, userType, loading, isAdminOrAsesor, isDeveloper, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
