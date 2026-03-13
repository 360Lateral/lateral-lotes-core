import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Plus, FileText, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoriasDoc = [
  { key: "financiero", label: "Financiero" },
  { key: "tecnico", label: "Técnico" },
  { key: "predial", label: "Predial" },
  { key: "normativo", label: "Normativo" },
  { key: "juridico", label: "Jurídico" },
  { key: "otro", label: "Otro" },
];

const DashboardLoteDocs = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("tecnico");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: lote } = useQuery({
    queryKey: ["doc-lote", id],
    queryFn: async () => {
      const { data } = await supabase.from("lotes").select("nombre_lote").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["doc-list", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analisis_documentos")
        .select("*")
        .eq("lote_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !nombre.trim()) throw new Error("Faltan campos obligatorios");

      const ext = file.name.split(".").pop();
      const path = `${id}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("documentos")
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from("analisis_documentos").insert({
        lote_id: id!,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria: categoria as any,
        tipo_archivo: file.type,
        url_storage: path,
      });
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      toast({ title: "Documento subido correctamente" });
      queryClient.invalidateQueries({ queryKey: ["doc-list", id] });
      setOpen(false);
      setNombre("");
      setDescripcion("");
      setFile(null);
    },
    onError: (err: any) => {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    },
  });

  const handleDownload = async (storagePath: string | null) => {
    if (!storagePath) return;
    const { data, error } = await supabase.storage.from("documentos").createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: "No se pudo generar enlace.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const deleteMutation = useMutation({
    mutationFn: async (doc: { id: string; url_storage: string | null }) => {
      if (doc.url_storage) {
        await supabase.storage.from("documentos").remove([doc.url_storage]);
      }
      const { error } = await supabase.from("analisis_documentos").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-list", id] });
      toast({ title: "Documento eliminado" });
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-body text-xl font-bold text-foreground">
          Documentos — {lote?.nombre_lote ?? "Cargando…"}
        </h1>
        <Button variant="default" size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Subir análisis
        </Button>
      </div>

      {categoriasDoc.map((cat) => {
        const catDocs = docs.filter((d) => d.categoria === cat.key);
        if (catDocs.length === 0) return null;
        return (
          <div key={cat.key} className="mb-6">
            <h2 className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cat.label}
            </h2>
            <div className="flex flex-col gap-2">
              {catDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-body text-sm font-medium text-foreground">{doc.nombre}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("es-CO")}
                          {doc.descripcion && ` · ${doc.descripcion}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.url_storage)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: doc.id, url_storage: doc.url_storage })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {!isLoading && docs.length === 0 && (
        <p className="py-8 text-center font-body text-sm text-muted-foreground">
          No hay documentos aún. Haz clic en "Subir análisis" para agregar uno.
        </p>
      )}

      {/* Upload Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-body">Subir análisis</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              uploadMutation.mutate();
            }}
          >
            <div>
              <Label className="text-xs">Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoriasDoc.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nombre del documento *</Label>
              <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Archivo (máx. 20 MB) *</Label>
              <Input
                ref={fileRef}
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" variant="default" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? "Subiendo…" : "Subir documento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardLoteDocs;
