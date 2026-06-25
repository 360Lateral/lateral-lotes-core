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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Mail, Calendar } from "lucide-react";
import { useOtorgarAccesoManual } from "@/hooks/admin/useOtorgarAccesoManual";
import { useDesarrolladoresList } from "@/hooks/admin/useDesarrolladoresList";
import { useLotesAdminLista } from "@/hooks/admin/useLotesAdminLista";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  loteIdPredefinido?: string;
  loteNombrePredefinido?: string;
  desarrolladorIdPredefinido?: string;
  desarrolladorLabelPredefinido?: string;
}

const PRESETS = [7, 30, 60, 90] as const;

export default function OtorgarAccesoLoteDialog({
  open,
  onOpenChange,
  loteIdPredefinido,
  loteNombrePredefinido,
  desarrolladorIdPredefinido,
  desarrolladorLabelPredefinido,
}: Props) {
  const [loteId, setLoteId] = useState(loteIdPredefinido ?? "");
  const [desarrolladorId, setDesarrolladorId] = useState(desarrolladorIdPredefinido ?? "");
  const [dias, setDias] = useState(30);
  const [motivo, setMotivo] = useState("");
  const [notificar, setNotificar] = useState(true);

  const otorgar = useOtorgarAccesoManual();
  const { data: desarrolladores } = useDesarrolladoresList();
  const { data: lotes } = useLotesAdminLista();

  useEffect(() => {
    if (open) {
      setLoteId(loteIdPredefinido ?? "");
      setDesarrolladorId(desarrolladorIdPredefinido ?? "");
      setDias(30);
      setMotivo("");
      setNotificar(true);
    }
  }, [open, loteIdPredefinido, desarrolladorIdPredefinido]);

  const motivoValido = motivo.trim().length >= 10;
  const canSubmit =
    !!loteId && !!desarrolladorId && motivoValido && dias >= 1 && dias <= 365 && !otorgar.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await otorgar.mutateAsync({
      lote_id: loteId,
      desarrollador_id: desarrolladorId,
      dias,
      motivo: motivo.trim(),
      notificar,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Otorgar acceso de cortesía
          </DialogTitle>
          <DialogDescription>
            El desarrollador verá el lote completo sin pagar PPV ni suscripción durante el período
            indicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lote */}
          <div className="space-y-1.5">
            <Label>Lote</Label>
            {loteIdPredefinido ? (
              <Input value={loteNombrePredefinido ?? loteIdPredefinido} disabled />
            ) : (
              <Select value={loteId} onValueChange={setLoteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un lote" />
                </SelectTrigger>
                <SelectContent>
                  {(lotes ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nombre_lote}
                      {l.ciudad ? ` · ${l.ciudad}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Desarrollador */}
          <div className="space-y-1.5">
            <Label>Desarrollador</Label>
            {desarrolladorIdPredefinido ? (
              <Input
                value={desarrolladorLabelPredefinido ?? desarrolladorIdPredefinido}
                disabled
              />
            ) : (
              <Select value={desarrolladorId} onValueChange={setDesarrolladorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un desarrollador" />
                </SelectTrigger>
                <SelectContent>
                  {(desarrolladores ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre ?? d.email ?? d.id.slice(0, 8)}
                      {d.email && d.nombre ? ` · ${d.email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Días */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Duración (días)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={dias}
                onChange={(e) => setDias(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                className="w-24"
              />
              <div className="flex gap-1">
                {PRESETS.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={dias === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDias(d)}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label>Motivo *</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Demo para inversor potencial, test de calidad de ficha, negociación en curso..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Queda registrado para auditoría. Mínimo 10 caracteres.
            </p>
          </div>

          {/* Notificar */}
          <div className="flex items-center justify-between rounded-md bg-muted/30 p-2.5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Notificar al desarrollador por email</span>
            </div>
            <Switch checked={notificar} onCheckedChange={setNotificar} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {otorgar.isPending ? "Otorgando..." : "Otorgar acceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
