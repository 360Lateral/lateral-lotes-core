import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSearch, MapPin, Loader2, Handshake } from "lucide-react";

const DashboardOwner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: lotesCount = 0, isLoading: l1 } = useQuery({
    queryKey: ["owner-lotes-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("lotes")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: lotesActivos = 0 } = useQuery({
    queryKey: ["owner-lotes-activos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("lotes")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user!.id)
        .eq("estado_disponibilidad", "Disponible");
      return count ?? 0;
    },
  });

  const { data: diagCount = 0, isLoading: l2 } = useQuery({
    queryKey: ["owner-diag-count", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("diagnosticos")
        .select("*", { count: "exact", head: true })
        .eq("email", user!.email!);
      return count ?? 0;
    },
  });

  const { data: negCount = 0 } = useQuery({
    queryKey: ["owner-neg-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("negociaciones")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user!.id);
      return count ?? 0;
    },
  });

  const loading = l1 || l2;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">Mi Panel</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tus lotes y diagnósticos
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/dashboard/lotes/nuevo")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Publicar lote
            </Button>
            <Button variant="outline" onClick={() => navigate("/diagnostico")}>
              <FileSearch className="mr-2 h-4 w-4" />
              Solicitar diagnóstico
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/owner/lotes")}>
              <CardContent className="pt-6 text-center">
                <MapPin className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold text-primary">{lotesCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Lotes publicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{lotesActivos}</p>
                <p className="text-xs text-muted-foreground mt-1">Lotes activos</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/owner/diagnosticos")}>
              <CardContent className="pt-6 text-center">
                <FileSearch className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold text-primary">{diagCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Diagnósticos</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/owner/negociaciones")}>
              <CardContent className="pt-6 text-center">
                <Handshake className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold text-primary">{negCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Negociaciones</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOwner;
