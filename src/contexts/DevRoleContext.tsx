import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";

export type DevRoleSimulated =
  | "none"
  | "visitante"
  | "super_admin"
  | "admin"
  | "experto"
  | "desarrollador"
  | "propietario"
  | "comisionista";

const STORAGE_KEY = "dev_role_simulado";

const VALID: DevRoleSimulated[] = [
  "none",
  "visitante",
  "super_admin",
  "admin",
  "experto",
  "desarrollador",
  "propietario",
  "comisionista",
];

const readStored = (): DevRoleSimulated => {
  if (typeof window === "undefined") return "none";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY) as DevRoleSimulated | null;
    return v && VALID.includes(v) ? v : "none";
  } catch {
    return "none";
  }
};

interface DevRoleContextType {
  devRole: DevRoleSimulated;
  setDevRole: (r: DevRoleSimulated) => void;
  isSimulating: boolean;
}

const DevRoleContext = createContext<DevRoleContextType>({
  devRole: "none",
  setDevRole: () => {},
  isSimulating: false,
});

export const useDevRole = () => useContext(DevRoleContext);

export const DevRoleProvider = ({ children }: { children: ReactNode }) => {
  const [devRole, setDevRole] = useState<DevRoleSimulated>(readStored);

  useEffect(() => {
    try {
      if (devRole === "none") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, devRole);
    } catch {
      // ignore
    }
  }, [devRole]);

  const value = useMemo(
    () => ({
      devRole,
      setDevRole,
      isSimulating: devRole !== "none",
    }),
    [devRole]
  );

  return <DevRoleContext.Provider value={value}>{children}</DevRoleContext.Provider>;
};
