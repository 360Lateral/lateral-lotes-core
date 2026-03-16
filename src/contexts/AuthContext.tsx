import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data) {
      setRoles(data.map((r) => r.role as AppRole));
    }
  };

  const fetchUserType = async (userId: string) => {
    const { data } = await supabase
      .from("perfiles")
      .select("user_type")
      .eq("id", userId)
      .single();
    if (data) {
      setUserType((data as any).user_type ?? null);
    }
  };

  const loadUserData = async (userId: string) => {
    await Promise.all([fetchRoles(userId), fetchUserType(userId)]);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setRoles([]);
          setUserType(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdminOrAsesor = roles.some((r) =>
    ["super_admin", "admin", "asesor"].includes(r)
  );

  const isDeveloper = roles.some((r) => r === "developer");

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
