import { useMemo, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SECCIONES_FICHA, codificarSecciones, encodeNotaB64 } from "@/lib/ficha-config";
import { toast } from "@/hooks/use-toast";

const PROD_BASE = "https://urbanix360.com";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loteId: string;
  loteNombre?: string;
}

const FichaConfigDialog = ({ open, onOpenChange, loteId, loteNombre }: Props) => {
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECCIONES_FICHA.map((s) => [s.key, s.defaultOn])),
  );
  const [titulo, setTitulo] = useState("");
  const [nota, setNota] = useState("");

  const activas = useMemo(
    () => SECCIONES_FICHA.filter((s) => checks[s.key]),
    [checks],
  );

  const construirUrl = (base: string) => {
    const params = new URLSearchParams();
    params.set("s", codificarSecciones(activas.map((s) => s.key)));
    if (titulo.trim()) params.set("titulo", titulo.trim());
    if (nota.trim()) params.set("nota", encodeNotaB64(nota.trim()));
    return `${base}/lotes/${loteId}/ficha?${params.toString()}`;
  };

  const abrirPreview = () => {
    window.open(construirUrl(window.location.origin), "_blank");
  };

  const copiarLink = async () => {
    const url = construirUrl(PROD_BASE);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: url });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar ficha para compartir</DialogTitle>
          <DialogDescription>
            Elige qué información incluir{loteNombre ? ` para "${loteNombre}"` : ""}. La configuración viaja en el link, así que el destinatario verá solo lo que selecciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Secciones a incluir
            </Label>
            <div className="space-y-2 rounded-md border border-border p-3">
              {SECCIONES_FICHA.map((s) => (
                <label key={s.key} className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={!!checks[s.key]}
                    onCheckedChange={(v) =>
                      setChecks((prev) => ({ ...prev, [s.key]: v === true }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.descripcion}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Se incluirán: {activas.length > 0 ? activas.map((a) => a.label).join(", ") : "Ninguna"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ficha-titulo">Título personalizado (opcional)</Label>
            <Input
              id="ficha-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value.slice(0, 80))}
              maxLength={80}
              placeholder="Ej: Oportunidad de inversión en El Poblado"
            />
            <p className="text-[10px] text-muted-foreground text-right">{titulo.length}/80</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ficha-nota">Nota / mensaje (opcional)</Label>
            <Textarea
              id="ficha-nota"
              value={nota}
              onChange={(e) => setNota(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="Ej: Hola Juan, te comparto este activo que puede interesarte."
              rows={3}
            />
            <p className="text-[10px] text-muted-foreground text-right">{nota.length}/200</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={abrirPreview} disabled={activas.length === 0}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> Abrir vista previa
          </Button>
          <Button onClick={copiarLink} disabled={activas.length === 0}>
            <Copy className="mr-1.5 h-4 w-4" /> Copiar link configurado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FichaConfigDialog;
