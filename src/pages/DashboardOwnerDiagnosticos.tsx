import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Loader2 } from "lucide-react";

const DashboardOwnerDiagnosticos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: diagnosticos, isLoading } = useQuery({
    queryKey: ["owner-diagnosticos", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("diagnosticos")
        .select("*")
        .eq("email", user!.email!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">Mis Diagnósticos</h1>
          <Button variant="outline" onClick={() => navigate("/diagnostico")}>
            <FileSearch className="mr-2 h-4 w-4" />
            Solicitar diagnóstico
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !diagnosticos || diagnosticos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <FileSearch className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">
              No tienes diagnósticos registrados.
            </p>
            <Button
              variant="link"
              className="mt-2 text-primary"
              onClick={() => navigate("/diagnostico")}
            >
              Solicitar un diagnóstico
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {diagnosticos.map((d) => (
              <Card key={d.id}>
                <CardContent className="pt-6 space-y-1">
                  <p className="font-medium text-foreground">
                    {d.ciudad ?? "Sin ciudad"}
                  </p>
                  {d.area_m2 && (
                    <p className="text-sm text-muted-foreground">
                      {d.area_m2.toLocaleString("es-CO")} m²
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString("es-CO")}
                    </p>
                    <Badge
                      variant={
                        d.estado === "Entregado"
                          ? "default"
                          : d.estado === "En proceso"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {d.estado ?? "Nuevo"}
                    </Badge>
                  </div>
                  {d.notas && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {d.notas}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOwnerDiagnosticos;
