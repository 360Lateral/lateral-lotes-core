import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const HomeButton = () => {
  const location = useLocation();

  const isHidden =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/bienvenida" ||
    location.pathname.startsWith("/dashboard");

  if (isHidden) return null;

  return (
    <Link
      to="/"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-all hover:scale-105 active:scale-95"
      style={{ backgroundColor: "#E8951A", color: "#0f1d3a" }}
      title="Volver al inicio"
    >
      <Home size={16} />
      <span className="font-body text-sm font-semibold hidden sm:inline">
        Inicio
      </span>
    </Link>
  );
};

export default HomeButton;
