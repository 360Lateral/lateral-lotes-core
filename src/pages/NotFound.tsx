import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PUBLIC_MOBILE_ACTION_PATHS } from "@/components/ui/FloatingActionStack";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center bg-primary text-white${PUBLIC_MOBILE_ACTION_PATHS.includes(location.pathname) ? " pb-24 md:pb-0" : ""}`}>
      <div className="text-9xl font-bold text-white/30">404</div>
      <div className="text-2xl font-semibold text-white">Página no encontrada</div>
      <div className="mt-2 text-sm text-white/70">
        La página que buscas no existe o fue movida.
      </div>
      <a
        href="/"
        className="mt-4 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        Volver al inicio
      </a>
    </div>
  );
};

export default NotFound;
