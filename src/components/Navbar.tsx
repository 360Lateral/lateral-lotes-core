import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Lotes", href: "/lotes" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "Contacto", href: "/#contacto" },
];

const Navbar = () => {
  const { user, isAdminOrAsesor, isDeveloper, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get display name from user metadata or email
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  return (
    <nav className="sticky top-0 z-50 bg-secondary">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <Logo variant="on-navy" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-sm text-secondary-foreground transition-colors hover:text-orange"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <>
              <span className="font-body text-sm text-secondary-foreground">
                {displayName}
              </span>
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
            </>
          ) : (
            <>
              <Button variant="navOutline" size="sm" asChild>
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/lotes">Ver lotes</Link>
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
                className="font-body text-sm text-secondary-foreground transition-colors hover:text-orange"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {loading ? null : user ? (
                <>
                  <span className="font-body text-sm text-secondary-foreground">
                    {displayName}
                  </span>
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
                </>
              ) : (
                <>
                  <Button variant="navOutline" size="sm" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      Iniciar sesión
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/lotes" onClick={() => setMobileOpen(false)}>
                      Ver lotes
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
