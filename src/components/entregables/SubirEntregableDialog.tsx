import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Loader2 } from "lucide-react";
import { useSubirEntregableArchivo } from "@/hooks/useSubirEntregableArchivo";
import { useAgregarUrlExterna } from "@/hooks/useAgregarUrlExterna";
import { toast } from "sonner";
import type { TipoEntregable } from "@/hooks/useEntregablesEngagement";

const TIPOS: { value: TipoEntregable; label: string }[] = [
  { value: "diagnostico_inmobiliario", label: "Diagnóstico Inmobiliario (Drive)" },
  { value: "presentacion_diagnostico", label: "Presentación del Diagnóstico (Drive)" },
  { value: "informe_area", label: "Informe por Área" },
  { value: "documento_soporte", label: "Documento Soporte" },
  { value: "otro", label: "Otro" },
];

const MAX_BYTES = 25 * 1024 * 1024;

interface Props {
  engagementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubirEntregableDialog = ({ engagementId, open, onOpenChange }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archivo
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoArchivo, setTipoArchivo] = useState<TipoEntregable>("informe_final_pdf");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [notasArchivo, setNotasArchivo] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // URL
  const [url, setUrl] = useState("");
  const [tipoUrl, setTipoUrl] = useState<TipoEntregable>("presentacion_gamma");
  const [nombreUrl, setNombreUrl] = useState("");
  const [notasUrl, setNotasUrl] = useState("");

  const subir = useSubirEntregableArchivo();
  const agregarUrl = useAgregarUrlExterna();

  const reset = () => {
    setArchivo(null);
    setTipoArchivo("informe_final_pdf");
    setNombreArchivo("");
    setNotasArchivo("");
    setUrl("");
    setTipoUrl("presentacion_gamma");
    setNombreUrl("");
    setNotasUrl("");
    setDragOver(false);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("El archivo supera el máximo de 25MB");
      return;
    }
    setArchivo(f);
    if (!nombreArchivo) setNombreArchivo(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmitArchivo = async () => {
    if (!archivo) return toast.error("Selecciona un archivo");
    if (!nombreArchivo.trim()) return toast.error("Ingresa un nombre");
    await subir.mutateAsync({
      engagementId,
      tipo: tipoArchivo,
      nombre: nombreArchivo.trim(),
      archivo,
      notas: notasArchivo.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  };

  const handleSubmitUrl = async () => {
    if (!url.trim()) return toast.error("Ingresa una URL");
    if (!nombreUrl.trim()) return toast.error("Ingresa un nombre");
    await agregarUrl.mutateAsync({
      engagementId,
      tipo: tipoUrl,
      nombre: nombreUrl.trim(),
      url: url.trim(),
      notas: notasUrl.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir / agregar entregable</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="archivo">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="archivo">Subir archivo</TabsTrigger>
            <TabsTrigger value="url">Agregar URL externa</TabsTrigger>
          </TabsList>

          <TabsContent value="archivo" className="space-y-3 pt-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
              }`}
            >
              <UploadCloud className="text-muted-foreground" size={32} />
              {archivo ? (
                <p className="text-sm font-medium">{archivo.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Arrastra un archivo o haz clic</p>
                  <p className="text-xs text-muted-foreground">PDF o imagen · máx. 25MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoArchivo} onValueChange={(v) => setTipoArchivo(v as TipoEntregable)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={nombreArchivo}
                onChange={(e) => setNombreArchivo(e.target.value)}
                placeholder="ej. Informe Final v1"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notasArchivo}
                onChange={(e) => setNotasArchivo(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmitArchivo} disabled={subir.isPending}>
                {subir.isPending && <Loader2 className="mr-2 animate-spin" size={16} />}
                Subir
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="url" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://gamma.app/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoUrl} onValueChange={(v) => setTipoUrl(v as TipoEntregable)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={nombreUrl}
                onChange={(e) => setNombreUrl(e.target.value)}
                placeholder="ej. Presentación ejecutiva"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notasUrl}
                onChange={(e) => setNotasUrl(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmitUrl} disabled={agregarUrl.isPending}>
                {agregarUrl.isPending && <Loader2 className="mr-2 animate-spin" size={16} />}
                Agregar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SubirEntregableDialog;
