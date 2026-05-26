import { createContext, useContext, useState, ReactNode, useMemo } from "react";

export type DevRoleSimulated =
  | "none"
  | "super_admin"
  | "admin"
  | "experto"
  | "desarrollador"
  | "propietario"
  | "comisionista";

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
  const [devRole, setDevRole] = useState<DevRoleSimulated>("none");

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
