import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, userType, isAdminOrAsesor, isDeveloper, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const profileLabel = userType === "dueno" ? "Dueño de lote" : userType === "desarrollador" ? "Desarrollador" : isAdminOrAsesor ? "Administrador" : null;

  // Contextual nav links based on user type
  const getNavLinks = () => {
    if (user && userType === "dueno") {
      return [
        { label: "Mis lotes", href: "/" },
        { label: "Diagnóstico", href: "/diagnostico" },
        { label: "Catálogo público", href: "/lotes" },
      ];
    }
    if (user && (userType === "developer" || isDeveloper)) {
      return [
        { label: "Catálogo", href: "/lotes" },
        { label: "Diagnóstico", href: "/diagnostico" },
        { label: "Nosotros", href: "/#nosotros" },
      ];
    }
    return [
      { label: "Resolutoría", href: "/resolutoria" },
      { label: "Planes", href: "/planes" },
      { label: "Índice de mercado", href: "/mercado" },
      { label: "Diagnóstico", href: "/diagnostico" },
      { label: "Nosotros", href: "/#nosotros" },
      { label: "Contacto", href: "/#contacto" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-50 bg-secondary">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link to="/" className="shrink-0">
          <Logo variant="on-navy" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-sm text-secondary-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-secondary-foreground">
                  {displayName}
                </span>
                {profileLabel && (
                  <Badge variant="outline" className="border-secondary-foreground/30 text-secondary-foreground/70 text-[10px] px-1.5 py-0">
                    {profileLabel}
                  </Badge>
                )}
              </div>
              {isAdminOrAsesor && (
                <Button variant="default" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
              {!isAdminOrAsesor && isDeveloper && (
                <Button variant="default" size="sm" asChild>
                  <Link to="/dashboard/developer">Dashboard</Link>
                </Button>
              )}
              {!isAdminOrAsesor && !isDeveloper && userType === "dueno" && (
                <Button variant="default" size="sm" asChild>
                  <Link to="/dashboard/lotes/nuevo">Publicar lote</Link>
                </Button>
              )}
              <button
                onClick={handleSignOut}
                className="text-secondary-foreground/60 transition-colors hover:text-primary"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Button variant="navOutline" size="sm" asChild>
                <Link to="/bienvenida">Registrarse</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="text-secondary-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-secondary-foreground/10 bg-secondary px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="font-body text-sm text-secondary-foreground transition-colors hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {loading ? null : user ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-secondary-foreground">
                      {displayName}
                    </span>
                    {profileLabel && (
                      <Badge variant="outline" className="border-secondary-foreground/30 text-secondary-foreground/70 text-[10px] px-1.5 py-0">
                        {profileLabel}
                      </Badge>
                    )}
                  </div>
                  {isAdminOrAsesor && (
                    <Button variant="default" size="sm" asChild>
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  {!isAdminOrAsesor && isDeveloper && (
                    <Button variant="default" size="sm" asChild>
                      <Link to="/dashboard/developer" onClick={() => setMobileOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  {!isAdminOrAsesor && !isDeveloper && userType === "dueno" && (
                    <Button variant="default" size="sm" asChild>
                      <Link to="/dashboard/lotes/nuevo" onClick={() => setMobileOpen(false)}>
                        Publicar lote
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="navOutline"
                    size="sm"
                    onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    className="flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="navOutline" size="sm" asChild>
                    <Link to="/bienvenida" onClick={() => setMobileOpen(false)}>
                      Registrarse
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      Iniciar sesión
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
