import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const estadoOptions = ["nuevo", "contactado", "negociacion", "cerrado", "descartado"];

const leadEstadoVariant = (e: string) => {
  switch (e) {
    case "nuevo": return "disponible" as const;
    case "contactado": return "reservado" as const;
    case "cerrado": return "vendido" as const;
    default: return "default" as const;
  }
};

const DashboardLeads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterLote, setFilterLote] = useState("Todos");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["dash-leads-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, lotes(nombre_lote)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ["dash-leads-lotes"],
    queryFn: async () => {
      const { data } = await supabase.from("lotes").select("id, nombre_lote").order("nombre_lote");
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("leads").update({ estado: estado as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dash-leads-all"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const filtered = leads.filter((l: any) => {
    if (filterEstado !== "Todos" && l.estado !== filterEstado) return false;
    if (filterLote !== "Todos" && l.lote_id !== filterLote) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <h1 className="mb-4 font-body text-xl font-bold text-foreground">Leads</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {estadoOptions.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-xs text-muted-foreground">Lote</Label>
          <Select value={filterLote} onValueChange={setFilterLote}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {lotes.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.nombre_lote}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Lote</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <tr
                  key={l.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  onClick={() => setSelectedLead(l)}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{l.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.telefono ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.lotes?.nombre_lote ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={leadEstadoVariant(l.estado)} className="text-xs">
                      {l.estado}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No hay leads.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Lead detail sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-body">Detalle del lead</SheetTitle>
            <SheetDescription className="font-body text-muted-foreground">
              Información completa y cambio de estado.
            </SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-4 flex flex-col gap-4 font-body text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-semibold text-foreground">{selectedLead.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-foreground">{selectedLead.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="text-foreground">{selectedLead.telefono ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lote</p>
                <p className="text-foreground">{selectedLead.lotes?.nombre_lote ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mensaje</p>
                <p className="text-foreground">{selectedLead.mensaje ?? "Sin mensaje"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-foreground">
                  {new Date(selectedLead.created_at).toLocaleString("es-CO")}
                </p>
              </div>

              <div>
                <Label className="text-xs">Cambiar estado</Label>
                <Select
                  value={selectedLead.estado}
                  onValueChange={(v) => {
                    updateMutation.mutate({ id: selectedLead.id, estado: v });
                    setSelectedLead({ ...selectedLead, estado: v });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estadoOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default DashboardLeads;
