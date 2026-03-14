import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Plus, Trash2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const usosOptions = ["Cualquiera", "Residencial", "Comercial", "Industrial", "Rural"];

const DashboardDeveloper = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [ciudad, setCiudad] = useState("");
  const [usoSuelo, setUsoSuelo] = useState("Cualquiera");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ["mis-alertas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createAlerta = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alertas").insert({
        user_id: user!.id,
        ciudad: ciudad || null,
        uso_suelo: usoSuelo,
        area_min: areaMin ? Number(areaMin) : null,
        area_max: areaMax ? Number(areaMax) : null,
        precio_max_m2: precioMax ? Number(precioMax) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-alertas"] });
      toast({ title: "Alerta creada", description: "Recibirás notificaciones cuando un lote coincida." });
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la alerta.", variant: "destructive" });
    },
  });

  const deleteAlerta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alertas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-alertas"] });
      toast({ title: "Alerta eliminada" });
    },
  });

  const resetForm = () => {
    setCiudad("");
    setUsoSuelo("Cualquiera");
    setAreaMin("");
    setAreaMax("");
    setPrecioMax("");
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-body text-xl font-bold text-foreground">Mis Alertas</h1>
        {!showForm && (
          <Button variant="default" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear alerta nueva
          </Button>
        )}
      </div>

      {/* Create alert form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-body text-sm font-semibold text-foreground">Nueva alerta</h2>
              <button onClick={resetForm}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Ciudad o municipio</Label>
                <Input
                  placeholder="Ej: Medellín"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Uso de suelo</Label>
                <Select value={usoSuelo} onValueChange={setUsoSuelo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {usosOptions.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Área mínima (m²)</Label>
                <Input type="number" min={0} placeholder="0" value={areaMin} onChange={(e) => setAreaMin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Área máxima (m²)</Label>
                <Input type="number" min={0} placeholder="Sin límite" value={areaMax} onChange={(e) => setAreaMax(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs text-muted-foreground">Precio máximo por m² (COP)</Label>
                <Input type="number" min={0} placeholder="Sin límite" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
              </div>
            </div>
            <div className="mt-5">
              <Button
                variant="default"
                onClick={() => createAlerta.mutate()}
                disabled={createAlerta.isPending}
              >
                {createAlerta.isPending ? "Guardando..." : "Guardar alerta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Bell className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">
            No tienes alertas configuradas.
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Crea una para recibir notificaciones cuando un lote coincida con tus criterios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alertas.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="font-body text-sm font-semibold text-foreground">
                      {a.ciudad || "Cualquier ciudad"}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteAlerta.mutate(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Eliminar alerta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1 font-body text-xs text-muted-foreground">
                  <p>Uso: {a.uso_suelo || "Cualquiera"}</p>
                  <p>
                    Área: {a.area_min ? `${a.area_min} m²` : "—"} – {a.area_max ? `${a.area_max} m²` : "Sin límite"}
                  </p>
                  <p>Precio máx/m²: {a.precio_max_m2 ? `$${Number(a.precio_max_m2).toLocaleString("es-CO")}` : "Sin límite"}</p>
                </div>
                <p className="mt-2 font-body text-[10px] text-muted-foreground">
                  Creada: {new Date(a.created_at).toLocaleDateString("es-CO")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardDeveloper;
