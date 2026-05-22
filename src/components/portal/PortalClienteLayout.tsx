import { ReactNode } from "react";
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
import Logo from "@/components/ui/Logo";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const obtenerIniciales = (email?: string | null) => {
  if (!email) return "C";
  return email.charAt(0).toUpperCase();
};

const PortalClienteLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Portal
              </span>
              <span className="text-sm font-semibold">Portal de clientes</span>
            </div>
          </div>
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
