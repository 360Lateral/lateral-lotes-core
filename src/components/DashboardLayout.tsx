import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/Logo";

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

  // Badges naranjas = urgentes (requieren acción admin).
  // Badges grises/blanco = informativos (volumen, no urgentes).
  const URGENT_HREFS = new Set<string>([
    "/dashboard/lotes/pendientes-validacion",
    "/dashboard/pagos",
    "/dashboard/solicitudes-contacto",
    "/dashboard/liquidaciones",
    "/dashboard/ventas",
  ]);
  const isUrgentBadge = (href: string) => URGENT_HREFS.has(href);

  const iniciales = (n: string) =>
    n
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const etiquetaDeRol = isSuperAdmin
    ? "Super admin"
    : isAdmin
    ? "Admin"
    : isExperto
    ? "Experto"
    : isDeveloper
    ? "Desarrollador"
    : "Usuario";

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
          { label: "Acuerdos firmados", href: "/dashboard/acuerdos-firmados", icon: ScrollText },
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
      admItems.push({ label: "Feedback", href: "/dashboard/feedback", icon: MessageCircle });
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
      <div className="px-4 pb-4 pt-5 mb-2 border-b border-white/10">
        <Link to="/">
          <Logo variant="on-navy" />
        </Link>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-white/45">Panel admin</div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2 pb-3">
        {groups.map((group, idx) => {
          const hasActive = group.items.some((it) => isActive(it.href, it.end));
          const userCollapsed = !!collapsed[group.key];
          const collapsible = group.title !== null;
          const isCollapsed = collapsible && userCollapsed && !hasActive;
          const groupBadgeSum = group.items.reduce((sum, it) => sum + badgeFor(it.href), 0);

          return (
            <div key={group.key} className={idx > 0 ? "mt-4" : "mt-1"}>
              {group.title && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center gap-1 px-3 mb-1 text-left text-[10px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/70 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                  )}
                  <span className="flex-1">{group.title}</span>
                  {isCollapsed && groupBadgeSum > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-secondary">
                      {groupBadgeSum}
                    </span>
                  )}
                </button>
              )}
              {!isCollapsed && (
                <div className="flex flex-col">
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.end);
                    const badgeNum = badgeFor(item.href);
                    const urgent = isUrgentBadge(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors border-l-2 ${
                          active
                            ? "border-primary bg-primary/15 text-white font-medium"
                            : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {badgeNum > 0 && (
                          <span
                            className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              urgent
                                ? "bg-primary text-secondary"
                                : "bg-white/12 text-white/85"
                            }`}
                          >
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

      {/* User footer */}
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
            {iniciales(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-white">{displayName}</div>
            <div className="flex items-center gap-1.5 truncate text-[10px] text-white/55">
              <span>{etiquetaDeRol}</span>
              {planSlug && (
                <Link
                  to="/planes"
                  className="rounded-full bg-primary/20 px-1.5 py-0 text-[9px] font-semibold text-primary hover:bg-primary/30 transition-colors"
                >
                  {PLAN_LABELS[planSlug] ?? planSlug}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Link
            to="/dashboard/preferencias"
            onClick={() => setMobileOpen(false)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-white/15 py-1.5 text-[10px] text-white/75 hover:bg-white/5 hover:text-white transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Preferencias
          </Link>
          <button
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-white/15 py-1.5 text-[10px] text-white/75 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Salir
          </button>
        </div>
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
