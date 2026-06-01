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
  Bell,
  BellRing,
  Handshake,
  Settings,
  BarChart3,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
  MessageCircle,
  ScrollText,
  ClipboardList,
  Briefcase,
  Trophy,
  CreditCard,
  Wallet,
  PieChart,
  Repeat,
  Tag,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useLotesPendientesValidacion } from "@/hooks/useLotesPendientesValidacion";
import { useSolicitudesContacto } from "@/hooks/useSolicitudesContacto";
import { useOrdenesServicio } from "@/hooks/useOrdenesServicio";
import { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlan, PLAN_LABELS } from "@/hooks/usePlan";
import CampanaNotificaciones from "@/components/notificaciones/CampanaNotificaciones";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  key: string;
  title: string | null; // null = no header (Inicio)
  items: NavItem[];
}

interface Props {
  children: React.ReactNode;
}

const STORAGE_PREFIX = "sidebar_grupo_";

const DashboardLayout = ({ children }: Props) => {
  const { user, roles, signOut, isDeveloper } = useAuth();
  const { planSlug } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
    navigate("/", { replace: true });
  };

  const isAdmin = roles.some((r) => ["super_admin", "admin"].includes(r));
  const isSuperAdmin = roles.includes("super_admin" as any);
  const isExperto = roles.includes("experto" as any);
  const isAdminOrExperto = roles.some((r) => ["super_admin", "admin", "experto"].includes(r));

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

  // Badges
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

  const { data: pendientesValidacion = [] } = useLotesPendientesValidacion();
  const validarCount = isAdmin ? pendientesValidacion.length : 0;

  const { data: solicitudesPendientes = [] } = useSolicitudesContacto("pendiente");
  const solicitudesCount = isAdmin ? solicitudesPendientes.length : 0;

  const { data: ordenesAbiertas = [] } = useOrdenesServicio(isAdmin ? "abierta" : undefined);
  const ordenesCount = isAdmin ? ordenesAbiertas.length : 0;

  const { data: transPendientes = [] } = useQuery({
    queryKey: ["transacciones-pendientes-count"],
    enabled: isAdmin,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("transacciones")
        .select("id", { count: "exact" })
        .eq("estado", "pendiente");
      if (error) return [];
      return data ?? [];
    },
  });
  const pagosCount = isAdmin ? transPendientes.length : 0;

  const { data: liquidacionesPendCount = 0 } = useQuery({
    queryKey: ["liquidaciones-pendientes-count"],
    enabled: isAdmin,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("liquidaciones_experto")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendiente");
      if (error) return 0;
      return count ?? 0;
    },
  });

  const { data: comisionesPendCount = 0 } = useQuery({
    queryKey: ["comisiones-pendientes-count"],
    enabled: isAdmin,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("comisiones_venta")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendiente");
      if (error) return 0;
      return count ?? 0;
    },
  });

  const badgeFor = (href: string): number => {
    switch (href) {
      case "/dashboard/notificaciones":
        return unreadCount;
      case "/dashboard/lotes/pendientes-validacion":
        return validarCount;
      case "/dashboard/solicitudes-contacto":
        return solicitudesCount;
      case "/dashboard/ordenes-servicio":
        return ordenesCount;
      case "/dashboard/pagos":
        return pagosCount;
      case "/dashboard/liquidaciones":
        return isAdmin ? (liquidacionesPendCount as number) : 0;
      case "/dashboard/ventas":
        return isAdmin ? (comisionesPendCount as number) : 0;
      default:
        return 0;
    }
  };

  // Build groups based on role
  const groups: NavGroup[] = useMemo(() => {
    const g: NavGroup[] = [];

    // Inicio — visible siempre que sea admin/experto/developer
    if (isAdminOrExperto || isDeveloper) {
      g.push({
        key: "inicio",
        title: null,
        items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, end: true }],
      });
    }

    // Diagnósticos
    const diagItems: NavItem[] = [];
    if (isAdminOrExperto) diagItems.push({ label: "Portafolio", href: "/dashboard/portafolio", icon: BarChart3 });
    if (isAdmin) {
      diagItems.push({ label: "Lotes", href: "/dashboard/lotes", icon: MapPin });
      diagItems.push({ label: "Leads", href: "/dashboard/leads", icon: Users });
    }
    if (diagItems.length) g.push({ key: "diagnosticos", title: "Diagnósticos", items: diagItems });

    // Marketplace (admin only)
    if (isAdmin) {
      g.push({
        key: "marketplace",
        title: "Marketplace",
        items: [
          { label: "Validar activos", href: "/dashboard/lotes/pendientes-validacion", icon: ShieldCheck },
          { label: "Solicitudes de contacto", href: "/dashboard/solicitudes-contacto", icon: MessageCircle },
          { label: "Negociaciones", href: "/dashboard/negociaciones", icon: Handshake },
        ],
      });
    }

    // Red de expertos
    const expItems: NavItem[] = [];
    if (isAdmin) expItems.push({ label: "Órdenes de servicio", href: "/dashboard/ordenes-servicio", icon: ClipboardList });
    if (isSuperAdmin) expItems.push({ label: "Contratos marco", href: "/dashboard/contratos-marco", icon: ScrollText });
    if (isAdminOrExperto) expItems.push({ label: "Desempeño expertos", href: "/dashboard/metricas/expertos", icon: Trophy });
    if (expItems.length) g.push({ key: "red_expertos", title: "Red de expertos", items: expItems });

    // Finanzas (admin)
    if (isAdmin) {
      g.push({
        key: "finanzas",
        title: "Finanzas",
        items: [
          { label: "Panorama financiero", href: "/dashboard/finanzas", icon: PieChart },
          { label: "Suscripciones", href: "/dashboard/suscripciones", icon: Repeat },
          { label: "Pagos", href: "/dashboard/pagos", icon: CreditCard },
          { label: "Liquidaciones", href: "/dashboard/liquidaciones", icon: Wallet },
          { label: "Ventas y comisiones", href: "/dashboard/ventas", icon: Handshake },
          { label: "Métricas", href: "/dashboard/metricas", icon: TrendingUp },
        ],
      });
    }

    // Administración (admin)
    if (isAdmin) {
      const admItems: NavItem[] = [{ label: "Usuarios", href: "/dashboard/usuarios", icon: UserCog }];
      if (isSuperAdmin) admItems.push({ label: "Precios y planes", href: "/dashboard/config-suscripciones", icon: Tag });
      if (isSuperAdmin) admItems.push({ label: "Configuración", href: "/dashboard/config", icon: Settings });
      g.push({ key: "administracion", title: "Administración", items: admItems });
    }

    // Mi trabajo (experto)
    if (isAdminOrExperto) {
      g.push({
        key: "mi_trabajo",
        title: "Mi trabajo",
        items: [{ label: "Mis órdenes", href: "/dashboard/mis-ordenes", icon: Briefcase }],
      });
    }

    // Developer extras
    if (isDeveloper) {
      g.push({
        key: "developer",
        title: "Developer",
        items: [
          { label: "Mis Alertas", href: "/dashboard/developer", icon: BellRing },
          { label: "Notificaciones", href: "/dashboard/notificaciones", icon: Bell },
        ],
      });
    }

    return g;
  }, [isAdmin, isSuperAdmin, isAdminOrExperto, isExperto, isDeveloper]);

  const isActive = (href: string, end?: boolean) => {
    if (end) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  // Collapse state per group, persisted in localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (typeof window !== "undefined") {
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith(STORAGE_PREFIX)) {
            init[key.slice(STORAGE_PREFIX.length)] = localStorage.getItem(key) === "1";
          }
        }
      } catch {
        // ignore
      }
    }
    return init;
  });

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_PREFIX + key, next[key] ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center px-5 py-5">
        <Link to="/">
          <Logo variant="on-navy" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, idx) => {
          const hasActive = group.items.some((it) => isActive(it.href, it.end));
          const userCollapsed = !!collapsed[group.key];
          // Inicio (no title): never collapsible
          const collapsible = group.title !== null;
          const isCollapsed = collapsible && userCollapsed && !hasActive;
          const groupBadgeSum = group.items.reduce((sum, it) => sum + badgeFor(it.href), 0);

          return (
            <div key={group.key} className={idx > 0 ? "mt-3" : ""}>
              {group.title && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-body text-xs font-semibold uppercase tracking-wide text-secondary-foreground/50 hover:text-secondary-foreground/80"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  )}
                  <span className="flex-1">{group.title}</span>
                  {isCollapsed && groupBadgeSum > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 font-body text-[10px] font-bold text-primary-foreground">
                      {groupBadgeSum}
                    </span>
                  )}
                </button>
              )}
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.end);
                    const badgeNum = badgeFor(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 font-body text-sm transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {badgeNum > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-body text-[10px] font-bold text-primary-foreground">
                            {badgeNum}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-secondary-foreground/10 px-4 py-4">
        <p className="truncate font-body text-xs text-secondary-foreground/70">{displayName}</p>
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
          asChild
          className="mt-2 w-full justify-start text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
        >
          <Link to="/dashboard/preferencias" onClick={() => setMobileOpen(false)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Preferencias
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
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
      {!isMobile && (
        <aside className="hidden w-[220px] shrink-0 bg-secondary md:flex md:flex-col">
          {sidebarContent}
        </aside>
      )}

      {isMobile && mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[220px] bg-secondary">{sidebarContent}</aside>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden bg-muted">
        {isMobile ? (
          <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
            <div className="flex items-center">
              <button onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5 text-foreground" />
              </button>
              <span className="ml-3 font-body text-sm font-semibold text-foreground">360Lateral</span>
            </div>
            <CampanaNotificaciones />
          </header>
        ) : (
          <header className="flex h-12 items-center justify-end border-b border-border bg-background px-4">
            <CampanaNotificaciones />
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
