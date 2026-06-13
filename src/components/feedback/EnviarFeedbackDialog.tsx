import { useState } from "react";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  Smile,
  MoreHorizontal,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEnviarFeedback } from "@/hooks/feedback/useEnviarFeedback";
import type {
  TipoFeedback,
  SeveridadFeedback,
} from "@/lib/feedback-transitions";
import { SEVERIDAD_LABEL } from "@/lib/feedback-transitions";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const TIPOS: { value: TipoFeedback; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "mejora", label: "Mejora", icon: Lightbulb },
  { value: "pregunta", label: "Pregunta", icon: HelpCircle },
  { value: "ux", label: "UX", icon: Smile },
  { value: "otro", label: "Otro", icon: MoreHorizontal },
];

const SEVERIDADES: SeveridadFeedback[] = ["baja", "media", "alta", "critica"];

const EnviarFeedbackDialog = ({ open, onOpenChange }: Props) => {
  const [tipo, setTipo] = useState<TipoFeedback>("mejora");
  const [severidad, setSeveridad] = useState<SeveridadFeedback>("media");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const enviar = useEnviarFeedback();
  const valido = titulo.trim().length >= 3 && descripcion.trim().length >= 10;

  const reset = () => {
    setTipo("mejora");
    setSeveridad("media");
    setTitulo("");
    setDescripcion("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    enviar.mutate(
      { tipo, severidad, titulo, descripcion },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!enviar.isPending) onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription>
            Reporta bugs, sugiere mejoras o cuéntanos qué se siente raro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-5 gap-2">
              {TIPOS.map((t) => {
                const Icon = t.icon;
                const activo = tipo === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors",
                      activo
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Severidad</Label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERIDADES.map((s) => {
                const activo = severidad === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeveridad(s)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs capitalize transition-colors",
                      activo
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {SEVERIDAD_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-titulo">Título</Label>
            <Input
              id="fb-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Resumen corto (mínimo 3 caracteres)"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-desc">Descripción</Label>
            <Textarea
              id="fb-desc"
              rows={5}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Qué pasó? ¿Qué esperabas? Pasos para reproducirlo si aplica (mínimo 10 caracteres)."
            />
            <p className="text-[11px] text-muted-foreground">
              {descripcion.length} caracteres
            </p>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-3 w-3" /> Información técnica que
              enviaremos
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1 rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] text-muted-foreground">
              <p>
                <span className="font-medium">URL:</span> {window.location.href}
              </p>
              <p>
                <span className="font-medium">Viewport:</span>{" "}
                {window.innerWidth}×{window.innerHeight}
              </p>
              <p className="truncate">
                <span className="font-medium">Browser:</span>{" "}
                {navigator.userAgent}
              </p>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter className="gap-2 sm:gap-2">
            <Link
              to="/feedback/mis-tickets"
              className="text-xs text-muted-foreground hover:text-foreground self-center mr-auto"
              onClick={() => onOpenChange(false)}
            >
              Ver mis tickets
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={enviar.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido || enviar.isPending}>
              {enviar.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnviarFeedbackDialog;
