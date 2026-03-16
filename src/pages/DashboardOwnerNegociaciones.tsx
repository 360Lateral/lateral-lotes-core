import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Handshake, Loader2 } from "lucide-react";

const estadoLabel: Record<string, string> = {
  activa: "Activa",
  en_revision: "En revisión",
  cerrada: "Cerrada",
  concretada: "Concretada",
};

const DashboardOwnerNegociaciones = () => {
  const { user } = useAuth();

  const { data: negociaciones, isLoading } = useQuery({
    queryKey: ["owner-negociaciones", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("negociaciones")
        .select("*, lotes(nombre_lote, ciudad)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-xl font-bold text-foreground">Mis Negociaciones</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !negociaciones || negociaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Handshake className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">
              No tienes negociaciones activas por el momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {negociaciones.map((n: any) => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <span className="font-body text-sm font-semibold text-foreground">
                      {(n.lotes as any)?.nombre_lote ?? "Lote"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {estadoLabel[n.estado] ?? n.estado}
                    </Badge>
                  </div>
                  <p className="font-body text-xs text-muted-foreground mb-3">
                    {(n.lotes as any)?.ciudad ?? ""} · {new Date(n.created_at).toLocaleDateString("es-CO")}
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/negociacion/${n.id}`}>Ir a sala</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOwnerNegociaciones;
