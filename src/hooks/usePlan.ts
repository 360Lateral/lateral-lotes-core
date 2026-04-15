import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlanLimits {
  plan_slug: string;
  max_lotes: number | null;
  max_alertas: number | null;
  max_consultas_ia_mes: number | null;
  max_documentos: number | null;
  acceso_analisis_completo: boolean;
  acceso_documentos: boolean;
  acceso_negociaciones: boolean;
  destacar_lotes: boolean;
}

const ADMIN_LIMITS: PlanLimits = {
  plan_slug: "enterprise",
  max_lotes: null,
  max_alertas: null,
  max_consultas_ia_mes: null,
  max_documentos: null,
  acceso_analisis_completo: true,
  acceso_documentos: true,
  acceso_negociaciones: true,
  destacar_lotes: true,
};

const GRATIS_DEFAULTS: PlanLimits = {
  plan_slug: "gratis",
  max_lotes: 1,
  max_alertas: 2,
  max_consultas_ia_mes: 5,
  max_documentos: 3,
  acceso_analisis_completo: false,
  acceso_documentos: false,
  acceso_negociaciones: false,
  destacar_lotes: false,
};

export const PLAN_LABELS: Record<string, string> = {
  gratis: "Gratis",
  basico: "Básico",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const usePlan = () => {
  const { user, isAdminOrAsesor } = useAuth();

  const { data, isLoading } = useQuery<PlanLimits>({
    queryKey: ["plan-limits", user?.id],
    enabled: !!user && !isAdminOrAsesor,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_plan_limits", {
        _user_id: user!.id,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as PlanLimits) ?? GRATIS_DEFAULTS;
    },
  });

  if (isAdminOrAsesor) {
    return { limits: ADMIN_LIMITS, isLoading: false, planSlug: "enterprise" };
  }

  const limits = data ?? (user ? undefined : GRATIS_DEFAULTS);

  return {
    limits,
    isLoading,
    planSlug: limits?.plan_slug ?? "gratis",
  };
};
