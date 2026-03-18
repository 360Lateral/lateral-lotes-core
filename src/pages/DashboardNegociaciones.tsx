import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const estadoLabel = (e: string) => {
  switch (e) {
    case "activa": return "Activa";
    case "en_revision": return "En revisión";
    case "cerrada": return "Cerrada";
    case "concretada": return "Concretada";
    default: return e;
  }
};

const DashboardNegociaciones = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: negociaciones = [], isLoading } = useQuery({
    queryKey: ["admin-negociaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negociaciones")
        .select("*, lotes(nombre_lote)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allUserIds = [...new Set(negociaciones.flatMap((n: any) => [n.developer_id, n.owner_id].filter(Boolean)))];
  const { data: perfiles = [] } = useQuery({
    queryKey: ["neg-perfiles", allUserIds.join(",")],
    enabled: allUserIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("perfiles").select("*").in("id", allUserIds);
      return data ?? [];
    },
  });

  const getName = (uid: string | null) => {
    if (!uid) return "Sin asignar";
    const p = perfiles.find((p: any) => p.id === uid);
    return p?.nombre ?? "—";
  };

  const updateNeg = useMutation({
    mutationFn: async ({ negId, updates }: { negId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("negociaciones").update(updates).eq("id", negId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-negociaciones"] });
      toast({ title: "Actualizado" });
    },
  });

  return (
    <DashboardLayout>
      <h1 className="mb-6 font-body text-xl font-bold text-foreground">Negociaciones</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : negociaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Handshake className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-body text-sm text-muted-foreground">No hay negociaciones aún.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2">Lote</th>
                <th className="pb-2">Developer</th>
                <th className="pb-2">Propietario</th>
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {negociaciones.map((n: any) => (
                <tr
                  key={n.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/negociacion/${n.id}`)}
                >
                  <td className="py-3 text-foreground font-medium">{(n.lotes as any)?.nombre_lote ?? "—"}</td>
                  <td className="py-3 text-muted-foreground">{getName(n.developer_id)}</td>
                  <td className="py-3 text-muted-foreground">{getName(n.owner_id)}</td>
                  <td className="py-3 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("es-CO")}</td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={n.estado}
                      onValueChange={(val) => updateNeg.mutate({ negId: n.id, updates: { estado: val } })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="en_revision">En revisión</SelectItem>
                        <SelectItem value="cerrada">Cerrada</SelectItem>
                        <SelectItem value="concretada">Concretada</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={n.contacto_visible}
                      onCheckedChange={(val) => updateNeg.mutate({ negId: n.id, updates: { contacto_visible: val } })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardNegociaciones;
