import { useEffect } from "react";

export const useAdvertenciaSalirSinGuardar = (hayCambiosSinGuardar: boolean) => {
  useEffect(() => {
    if (!hayCambiosSinGuardar) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hayCambiosSinGuardar]);
};
