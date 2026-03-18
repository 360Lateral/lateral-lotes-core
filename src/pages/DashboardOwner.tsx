import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, FileSearch, MapPin, Loader2, Handshake, Upload, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const DashboardOwner = () => {
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isComisionista = userType === "comisionista";

  const { data: comDoc } = useQuery({
    queryKey: ["comisionista-doc", user?.id],
    enabled: !!user && isComisionista,
    queryFn: async () => {
      const { data } = await supabase
        .from("documentos_comisionista")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const handleUploadDoc = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `comisionista/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("documentos")
        .upload(path, file);
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase
        .from("documentos_comisionista")
        .insert({
          user_id: user.id,
          nombre_documento: file.name,
          url_storage: path,
          estado: "pendiente",
        });
      if (insertErr) throw insertErr;

      queryClient.invalidateQueries({ queryKey: ["comisionista-doc"] });
      toast.success("Documento de autorización enviado. Un administrador lo revisará.");
    } catch (err: any) {
      toast.error(err.message || "Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const { data: lotesCount = 0, isLoading: l1 } = useQuery({
    queryKey: ["owner-lotes-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("lotes")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: lotesActivos = 0 } = useQuery({
    queryKey: ["owner-lotes-activos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("lotes")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user!.id)
        .eq("estado_disponibilidad", "Disponible");
      return count ?? 0;
    },
  });

  const { data: diagCount = 0, isLoading: l2 } = useQuery({
    queryKey: ["owner-diag-count", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("diagnosticos")
        .select("*", { count: "exact", head: true })
        .eq("email", user!.email!);
      return count ?? 0;
    },
  });

  const { data: negCount = 0 } = useQuery({
    queryKey: ["owner-neg-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("negociaciones")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user!.id);
      return count ?? 0;
    },
  });

  const loading = l1 || l2;
  const comDocApproved = comDoc?.estado === "aprobado";
  const comDocPending = comDoc?.estado === "pendiente";
  const comDocRejected = comDoc?.estado === "rechazado";
  const comDocMissing = !comDoc;
  const canPublish = !isComisionista || comDocApproved;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Mi Panel</h1>
          <p className="text-sm text-muted-foreground">
            {isComisionista
              ? "Gestiona los lotes que representas"
              : "Gestiona tus lotes y diagnósticos"}
          </p>
        </div>

        {/* Comisionista doc alerts */}
        {isComisionista && (comDocMissing || comDocRejected) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Documento de autorización requerido</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                {comDocRejected
                  ? "Tu documento fue rechazado. Por favor sube uno nuevo."
                  : "Como comisionista, debes subir un documento que certifique que estás autorizado por el dueño del lote para negociar su propiedad."}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadDoc(f);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Subir documento de autorización
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isComisionista && comDocPending && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Documento en revisión</AlertTitle>
            <AlertDescription>
              Tu documento de autorización está siendo revisado por un administrador. Una vez aprobado, podrás publicar lotes.
            </AlertDescription>
          </Alert>
        )}

        {isComisionista && comDocApproved && (
          <Alert className="border-green-500/50 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Autorización verificada</AlertTitle>
            <AlertDescription className="text-green-600">
              Tu documento de autorización ha sido aprobado. Puedes publicar y gestionar lotes.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {/* Action card: Publicar lote */}
            <Card
              className={`cursor-pointer border-dashed border-primary/30 hover:shadow-md transition-shadow ${!canPublish ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => canPublish && navigate("/dashboard/lotes/nuevo")}
            >
              <CardContent className="pt-6 text-center">
                <Plus className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-primary">Publicar lote</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/owner/lotes")}>
              <CardContent className="pt-6 text-center">
                <MapPin className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold text-primary">{lotesCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Lotes publicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{lotesActivos}</p>
                <p className="text-xs text-muted-foreground mt-1">Lotes activos</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/owner/diagnosticos")}>
              <CardContent className="pt-6 text-center">
                <FileSearch className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold text-primary">{diagCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Diagnósticos</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/dashboard/owner/negociaciones")}>
              <CardContent className="pt-6 text-center">
                <Handshake className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-3xl font-bold text-primary">{negCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Negociaciones</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOwner;
