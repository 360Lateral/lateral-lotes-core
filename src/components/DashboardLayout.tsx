import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MapPin,
  Users,
  UserCog,
  LogOut,
  Menu,
  X,
  Bell,
  BellRing,
  Handshake,
  FileSearch,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlan, PLAN_LABELS } from "@/hooks/usePlan";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Lotes", href: "/dashboard/lotes", icon: MapPin },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
];

const adminOnlyItems = [
  { label: "Negociaciones", href: "/dashboard/negociaciones", icon: Handshake },
  { label: "Usuarios", href: "/dashboard/usuarios", icon: UserCog },
];

interface Props {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  const { user, roles, signOut, isDeveloper, userType } = useAuth();
  const { planSlug } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
    navigate("/", { replace: true });
  };
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = roles.some((r) => ["super_admin", "admin"].includes(r));
  const isAdminOrAsesor = roles.some((r) => ["super_admin", "admin", "asesor"].includes(r));
  const isOwner = userType === "dueno" || userType === "comisionista";
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  const developerItems = isDeveloper ? [
    { label: "Mis Alertas", href: "/dashboard/developer", icon: BellRing },
    { label: "Notificaciones", href: "/dashboard/notificaciones", icon: Bell },
  ] : [];

  const ownerItems = isOwner && !isAdminOrAsesor ? [
    { label: "Mi Panel", href: "/dashboard/owner", icon: LayoutDashboard, end: true },
    { label: "Mis Lotes", href: "/dashboard/owner/lotes", icon: MapPin },
    { label: "Diagnósticos", href: "/dashboard/owner/diagnosticos", icon: FileSearch },
    { label: "Negociaciones", href: "/dashboard/owner/negociaciones", icon: Handshake },
  ] : [];

  const allItems = [
    ...(isAdminOrAsesor ? navItems : []),
    ...(isAdmin ? adminOnlyItems : []),
    ...developerItems,
    ...ownerItems,
  ];

  const finalItems = allItems.length > 0 ? allItems : [navItems[0]];

  // Unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user && isDeveloper,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notificaciones")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("leida", false);
      if (error) return 0;
      return count ?? 0;
    },
  });

  const isActive = (href: string, end?: boolean) => {
    if (end) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center px-5 py-5">
        <Link to="/">
          <Logo variant="on-navy" />
        </Link>
      </div>

      {/* Nav links */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {finalItems.map((item) => {
          const active = isActive(item.href, (item as any).end);
          const isNotifLink = item.href === "/dashboard/notificaciones";
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {isNotifLink && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-body text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-secondary-foreground/10 px-4 py-4">
        <p className="truncate font-body text-xs text-secondary-foreground/70">
          {displayName}
        </p>
        {planSlug && (
          <Link
            to="/planes"
            className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 font-body text-[10px] font-semibold text-primary hover:bg-primary/30 transition-colors"
          >
            Plan {PLAN_LABELS[planSlug] ?? planSlug}
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="hidden w-[220px] shrink-0 bg-secondary md:flex md:flex-col">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[220px] bg-secondary">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-muted">
        {/* Mobile header */}
        {isMobile && (
          <header className="flex h-12 items-center border-b border-border bg-background px-4">
            <button onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <span className="ml-3 font-body text-sm font-semibold text-foreground">
              360Lateral
            </span>
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
