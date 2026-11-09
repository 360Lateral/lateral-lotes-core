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
      className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 shadow-lg md:h-12 md:w-12 md:p-0 transition-all hover:scale-105 active:scale-95"
      style={{ backgroundColor: "#E8951A", color: "#0f1d3a" }}
      title="Inicio"
      aria-label="Inicio"
    >
      <Home size={16} />
      <span className="font-body text-sm font-semibold hidden sm:inline md:sr-only">
        Inicio
      </span>
    </Link>
  );
};

export default HomeButton;
