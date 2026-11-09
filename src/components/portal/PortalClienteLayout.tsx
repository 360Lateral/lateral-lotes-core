import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/components/ui/Logo";
import { BarChart3, Briefcase, ChevronDown, LogOut, Menu, Store, User as UserIcon } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const obtenerIniciales = (email?: string | null) => {
  if (!email) return "C";
  return email.charAt(0).toUpperCase();
};

const enlacesPortal = [
  { to: "/portal/portafolio", label: "Portafolio", icon: BarChart3, end: false },
  { to: "/portal", label: "Mis diagnósticos", icon: Briefcase, end: true },
];

const PortalClienteLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const nombre =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.nombre as string) ||
    user?.email ||
    "Cliente";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Logo />
            <nav className="hidden md:flex items-center gap-1">
              {enlacesPortal.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1 md:contents">
          <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 md:hidden" aria-label="Abrir menú del portal">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="w-[min(320px,85vw)] overflow-y-auto md:hidden [&>button]:h-11 [&>button]:w-11 [&>button]:flex [&>button]:items-center [&>button]:justify-center">
              <SheetHeader className="mb-6 pr-10 text-left">
                <SheetTitle>Mi portal</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navegación del portal" className="flex flex-col gap-2">
                {[...enlacesPortal, { to: "/mercado", label: "Mercado", icon: Store, end: false }].map(({ to, label, icon: Icon, end }) => (
                  <Button key={to} variant="ghost" asChild className={cn(
                    "h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-base",
                    (end ? pathname === to || pathname.startsWith(`${to}/engagement/`) : pathname === to || pathname.startsWith(`${to}/`))
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground",
                  )}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={() => setMenuAbierto(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </NavLink>
                  </Button>
                ))}
                <div className="my-2 border-t border-border" />
                <Button variant="ghost" disabled className="min-h-11 justify-start text-base">
                  <UserIcon className="h-5 w-5" /> Mi perfil
                </Button>
                <Button variant="ghost" className="min-h-11 justify-start text-base" onClick={() => {
                  setMenuAbierto(false);
                  void handleSignOut();
                }}>
                  <LogOut className="h-5 w-5" /> Cerrar sesión
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-10">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {obtenerIniciales(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm max-w-[180px] truncate">
                  {nombre}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <UserIcon className="h-4 w-4 mr-2" /> Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-muted-foreground text-center">
          © 360Lateral — Soporte:{" "}
          <a
            href="mailto:soporte@360lateral.com"
            className="text-primary hover:underline"
          >
            soporte@360lateral.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default PortalClienteLayout;
