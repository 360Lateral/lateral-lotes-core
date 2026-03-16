import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileSearch, MapPin, Loader2, Handshake } from "lucide-react";

const DashboardOwner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mis lotes
  const { data: lotes, isLoading: loadingLotes } = useQuery({
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

  // Mis diagnósticos
  const { data: diagnosticos, isLoading: loadingDiag } = useQuery({
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

  // Negociaciones activas
  const { data: negociaciones } = useQuery({
    queryKey: ["owner-negociaciones", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("negociaciones")
        .select("id, estado, created_at, lotes(nombre_lote)")
        .eq("owner_id", user!.id)
        .eq("estado", "activa")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const loading = loadingLotes || loadingDiag;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Mi Panel
            </h1>
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
            <Button
              variant="outline"
              onClick={() => navigate("/diagnostico")}
            >
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
          <>
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {lotes?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lotes publicados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {lotes?.filter(l => l.estado_disponibilidad === "Disponible").length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lotes activos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {diagnosticos?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diagnósticos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mis Lotes */}
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Mis Lotes
              </h2>
              {!lotes || lotes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p>Aún no has publicado ningún lote.</p>
                    <Button
                      variant="link"
                      className="mt-2 text-primary"
                      onClick={() => navigate("/dashboard/lotes/nuevo")}
                    >
                      Publicar mi primer lote
                    </Button>
                  </CardContent>
                </Card>
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
                          <Badge
                            variant={lote.es_publico ? "default" : "secondary"}
                          >
                            {lote.es_publico ? "Público" : "Borrador"}
                          </Badge>
                          <Badge variant="outline">
                            {lote.estado_disponibilidad}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Mis Diagnósticos */}
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Mis Diagnósticos
              </h2>
              {!diagnosticos || diagnosticos.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileSearch className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p>No tienes diagnósticos registrados.</p>
                    <Button
                      variant="link"
                      className="mt-2 text-primary"
                      onClick={() => navigate("/diagnostico")}
                    >
                      Solicitar un diagnóstico
                    </Button>
                  </CardContent>
                </Card>
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
                          <Badge variant={
                            (d as any).estado === "Entregado" ? "default" :
                            (d as any).estado === "En proceso" ? "secondary" :
                            "outline"
                          }>
                            {(d as any).estado ?? "Nuevo"}
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
            </section>

            {/* Negociaciones activas */}
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Negociaciones activas
              </h2>
              {!negociaciones || negociaciones.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Handshake className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p>No tienes negociaciones activas por el momento.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {negociaciones.map((n) => (
                    <Card key={n.id}>
                      <CardContent className="pt-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {(n.lotes as any)?.nombre_lote ?? "Lote"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleDateString("es-CO")}
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/negociacion/${n.id}`}>Ir a sala</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOwner;
