import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  usuario: { id: string; email: string; full_name: string | null } | null;
  onOpenChange: (open: boolean) => void;
}

const EliminarUsuarioDialog = ({ usuario, onOpenChange }: Props) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    setConfirmEmail("");
  }, [usuario?.id]);

  const { data: resumen, isLoading } = useQuery({
    queryKey: ["preview-delete-user", usuario?.id],
    enabled: !!usuario,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action: "preview_delete", user_id: usuario!.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as {
        lotes: number; engagements: number; transacciones: number; negociaciones: number;
      };
    },
  });

  const eliminar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action: "delete_user", user_id: usuario!.id, confirm_email: confirmEmail },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuario eliminado definitivamente");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const coincide = confirmEmail.trim().toLowerCase() === (usuario?.email ?? "").toLowerCase();

  return (
    <Dialog open={!!usuario} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar definitivamente
          </DialogTitle>
          <DialogDescription>
            {usuario?.full_name || usuario?.email} — esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="mb-2 font-medium text-foreground">Información asociada</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ul className="space-y-1 text-muted-foreground">
                <li>{resumen?.lotes ?? 0} lotes (quedarán sin propietario asignado)</li>
                <li>{resumen?.engagements ?? 0} engagements</li>
                <li>{resumen?.transacciones ?? 0} pagos registrados (se conservan)</li>
                <li>{resumen?.negociaciones ?? 0} negociaciones</li>
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Escribe <span className="font-medium text-foreground">{usuario?.email}</span> para confirmar
            </Label>
            <Input
              id="confirm-email"
              value={confirmEmail}
              autoComplete="off"
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={usuario?.email}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={!coincide || eliminar.isPending}
            onClick={() => eliminar.mutate()}
          >
            {eliminar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar cuenta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EliminarUsuarioDialog;
