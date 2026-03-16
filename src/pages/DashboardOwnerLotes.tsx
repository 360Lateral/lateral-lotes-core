import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Loader2 } from "lucide-react";

const DashboardOwnerLotes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: lotes, isLoading } = useQuery({
    queryKey: ["owner-lotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("lotes")
        .select("id, nombre_lote, ciudad, departamento, area_total_m2, es_publico, estado_disponibilidad, created_at")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">Mis Lotes</h1>
          <Button onClick={() => navigate("/dashboard/lotes/nuevo")}>
            <Plus className="mr-2 h-4 w-4" />
            Publicar lote
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lotes || lotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">
              Aún no has publicado ningún lote.
            </p>
            <Button
              variant="link"
              className="mt-2 text-primary"
              onClick={() => navigate("/dashboard/lotes/nuevo")}
            >
              Publicar mi primer lote
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lotes.map((lote) => (
              <Card
                key={lote.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/lotes/${lote.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold truncate">
                    {lote.nombre_lote}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {lote.ciudad}
                    {lote.departamento ? `, ${lote.departamento}` : ""}
                  </p>
                  {lote.area_total_m2 && (
                    <p className="text-sm">
                      {lote.area_total_m2.toLocaleString("es-CO")} m²
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={lote.es_publico ? "default" : "secondary"}>
                      {lote.es_publico ? "Público" : "Borrador"}
                    </Badge>
                    <Badge variant="outline">{lote.estado_disponibilidad}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOwnerLotes;
