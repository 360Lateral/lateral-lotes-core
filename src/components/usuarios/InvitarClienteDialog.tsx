import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useInvitarCliente } from "@/hooks/useInvitarCliente";
import { useEngagementsSinCliente } from "@/hooks/useEngagementsSinCliente";

interface InvitarClienteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const NO_ENGAGEMENT = "__none__";

export default function InvitarClienteDialog({
  open,
  onOpenChange,
}: InvitarClienteDialogProps) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [engagementId, setEngagementId] = useState<string>(NO_ENGAGEMENT);
  const [errors, setErrors] = useState<{ email?: string; nombre?: string }>({});

  const invitar = useInvitarCliente();
  const { data: engagements = [], isLoading: loadingEng } = useEngagementsSinCliente();

  const reset = () => {
    setEmail("");
    setNombre("");
    setTelefono("");
    setEngagementId(NO_ENGAGEMENT);
    setErrors({});
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; nombre?: string } = {};
    const emailTrim = email.trim();
    const nombreTrim = nombre.trim();
    if (!emailTrim || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailTrim)) {
      newErrors.email = "Email inválido";
    }
    if (nombreTrim.length < 2) {
      newErrors.nombre = "Nombre demasiado corto";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    invitar.mutate(
      {
        email: emailTrim,
        nombre_completo: nombreTrim,
        telefono: telefono.trim() || undefined,
        engagement_id:
          engagementId !== NO_ENGAGEMENT ? engagementId : undefined,
      },
      {
        onSuccess: (data) => {
          if (!data?.conflicto_usuario_existente) {
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar cliente</DialogTitle>
          <DialogDescription>
            Crea una cuenta de cliente (rol inversor) y envíale un email para que
            establezca su contraseña.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cliente-email">Email *</Label>
            <Input
              id="cliente-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              autoComplete="off"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-nombre">Nombre completo *</Label>
            <Input
              id="cliente-nombre"
              required
              minLength={2}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-telefono">Teléfono (opcional)</Label>
            <Input
              id="cliente-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+57 300 000 0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-engagement">Asignar a engagement (opcional)</Label>
            <Select value={engagementId} onValueChange={setEngagementId}>
              <SelectTrigger id="cliente-engagement">
                <SelectValue
                  placeholder={loadingEng ? "Cargando..." : "No asignar"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ENGAGEMENT}>No asignar</SelectItem>
                {engagements.map((eng) => (
                  <SelectItem key={eng.id} value={eng.id}>
                    {eng.lote_nombre}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {eng.estado}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingEng && engagements.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay engagements activos sin cliente.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={invitar.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={invitar.isPending}>
              {invitar.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Crear y enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
