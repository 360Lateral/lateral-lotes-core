import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  usePropietariosList,
  useAsignarPropietario,
} from "@/hooks/useAsignarPropietario";
import { useInvitarCliente } from "@/hooks/useInvitarCliente";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  loteId: string | null;
  loteName?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const AsignarPropietarioDialog = ({ open, onOpenChange, loteId, loteName }: Props) => {
  const qc = useQueryClient();
  const { data: propietarios = [], isLoading } = usePropietariosList();
  const asignar = useAsignarPropietario();
  const invitar = useInvitarCliente();

  const [sel, setSel] = useState<string>("");

  // Crear nuevo
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState<{ email?: string; nombre?: string }>({});
  const [isCreatingAndAssigning, setIsCreatingAndAssigning] = useState(false);

  const reset = () => {
    setSel("");
    setEmail("");
    setNombre("");
    setTelefono("");
    setErrors({});
    setIsCreatingAndAssigning(false);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["dash-lotes-list"] });
    qc.invalidateQueries({ queryKey: ["lotes-internos"] });
    qc.invalidateQueries({ queryKey: ["mis-activos"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["propietarios-list"] });
  };

  const onConfirmExistente = () => {
    if (!loteId || !sel) return;
    asignar.mutate(
      { lote_id: loteId, propietario_id: sel },
      {
        onSuccess: () => {
          invalidateAll();
          onOpenChange(false);
        },
      }
    );
  };

  const onCrearYAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId) return;

    const emailTrim = email.trim();
    const nombreTrim = nombre.trim();
    const newErrors: { email?: string; nombre?: string } = {};
    if (!EMAIL_RE.test(emailTrim)) newErrors.email = "Email inválido";
    if (nombreTrim.length < 4) newErrors.nombre = "Mínimo 4 caracteres";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsCreatingAndAssigning(true);
    try {
      const data = await invitar.mutateAsync({
        email: emailTrim,
        nombre_completo: nombreTrim,
        telefono: telefono.trim() || undefined,
      });

      if (data?.conflicto_usuario_existente) {
        toast.warning(
          "Ese email pertenece a un usuario interno. Usa otro email o asigna desde la pestaña 'Seleccionar existente' si ya es propietario."
        );
        setIsCreatingAndAssigning(false);
        return;
      }

      if (!data?.user_id) {
        toast.error("No se obtuvo el id del nuevo propietario");
        setIsCreatingAndAssigning(false);
        return;
      }

      await asignar.mutateAsync({ lote_id: loteId, propietario_id: data.user_id });

      invalidateAll();
      toast.success(
        "Propietario creado y asignado. Le llegará email de invitación en minutos."
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo crear y asignar");
    } finally {
      setIsCreatingAndAssigning(false);
    }
  };

  const busy = isCreatingAndAssigning || invitar.isPending || asignar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar propietario al lote</DialogTitle>
          <DialogDescription>
            {loteName ?? "Selecciona o crea el propietario para este lote."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existente" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existente">Seleccionar existente</TabsTrigger>
            <TabsTrigger value="nuevo">Crear nuevo</TabsTrigger>
          </TabsList>

          <TabsContent value="existente" className="space-y-4 pt-2">
            <Select value={sel} onValueChange={setSel} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Cargando…" : "Selecciona un propietario"}
                />
              </SelectTrigger>
              <SelectContent>
                {propietarios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre || p.email || p.id}
                    {p.email && p.nombre ? (
                      <span className="text-muted-foreground"> — {p.email}</span>
                    ) : null}
                  </SelectItem>
                ))}
                {!isLoading && propietarios.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No hay usuarios con rol propietario.
                  </div>
                )}
              </SelectContent>
            </Select>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button onClick={onConfirmExistente} disabled={!sel || busy}>
                {asignar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Asignar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="nuevo" className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Al crear, el nuevo propietario recibirá un email de invitación para activar
              su cuenta. Una vez creado, quedará asignado automáticamente como
              propietario de este lote.
            </p>

            <form onSubmit={onCrearYAsignar} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="prop-email">Email *</Label>
                <Input
                  id="prop-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="propietario@ejemplo.com"
                  autoComplete="off"
                  disabled={busy}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-nombre">Nombre completo *</Label>
                <Input
                  id="prop-nombre"
                  required
                  minLength={4}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  disabled={busy}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prop-tel">Teléfono (opcional)</Label>
                <Input
                  id="prop-tel"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+57 300 000 0000"
                  disabled={busy}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear y asignar
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AsignarPropietarioDialog;
