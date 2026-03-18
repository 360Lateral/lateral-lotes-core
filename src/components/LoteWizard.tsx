import { useState, ChangeEvent, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  ImagePlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { calculateLoteScore } from "@/lib/loteScore";
import LoteScoreResult from "@/components/LoteScoreResult";


const STEPS = [
  { num: 1, label: "Datos básicos" },
  { num: 2, label: "Ubicación" },
  { num: 3, label: "Información técnica" },
  { num: 4, label: "Fotos y documentos" },
];

interface WizardForm {
  // Step 1
  nombre_lote: string;
  nombre_propietario: string;
  tipo_lote: string;
  area_total_m2: string;
  frente_ml: string;
  fondo_ml: string;
  precio_cop: string;
  notas: string;
  // Step 2
  departamento: string;
  ciudad: string;
  barrio: string;
  direccion: string;
  lat: string;
  lng: string;
  // Step 3
  uso_principal: string;
  servicios: Record<string, boolean>;
  tiene_escritura: string;
  tiene_deudas: string;
  problema_juridico: string;
  observaciones: string;
  // Step 4 handled separately
}

const emptyWizard: WizardForm = {
  nombre_lote: "",
  nombre_propietario: "",
  tipo_lote: "",
  area_total_m2: "",
  frente_ml: "",
  fondo_ml: "",
  precio_cop: "",
  notas: "",
  departamento: "",
  ciudad: "",
  barrio: "",
  direccion: "",
  lat: "",
  lng: "",
  uso_principal: "",
  servicios: {
    Agua: false,
    Energía: false,
    Gas: false,
    Alcantarillado: false,
    "Vía pavimentada": false,
  },
  tiene_escritura: "",
  tiene_deudas: "",
  problema_juridico: "",
  observaciones: "",
};

interface DocFile {
  file: File;
  categoria: string;
}

const LoteWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(emptyWizard);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMode, setVideoMode] = useState<"upload" | "link">("upload");
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [published, setPublished] = useState(false);

  const { data: mapsKey } = useGoogleMapsKey();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: mapsKey ?? "", id: "google-map-script" });

  const update = (key: keyof WizardForm, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleServicio = (s: string) =>
    setForm((p) => ({
      ...p,
      servicios: { ...p.servicios, [s]: !p.servicios[s] },
    }));

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setForm((p) => ({
      ...p,
      lat: e.latLng!.lat().toFixed(6),
      lng: e.latLng!.lng().toFixed(6),
    }));
  }, []);

  // ---- Photo handlers ----
  const handlePhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos((p) => [...p, ...toAdd]);
    setPhotoPreviews((p) => [
      ...p,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPhotoPreviews((p) => p.filter((_, i) => i !== idx));
  };

  // ---- Doc handlers ----
  const handleDocAdd = (e: ChangeEvent<HTMLInputElement>, cat: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocs((p) => [...p, { file, categoria: cat }]);
  };

  const removeDoc = (idx: number) => setDocs((p) => p.filter((_, i) => i !== idx));

  // ---- Validation ----
  const validateStep = (s: number): boolean => {
    const errs: Record<string, boolean> = {};
    if (s === 1) {
      if (!form.nombre_lote.trim()) errs.nombre_lote = true;
      if (!form.nombre_propietario.trim()) errs.nombre_propietario = true;
      if (!form.tipo_lote) errs.tipo_lote = true;
      if (!form.area_total_m2) errs.area_total_m2 = true;
      if (!form.precio_cop) errs.precio_cop = true;
    }
    if (s === 2) {
      if (!form.departamento.trim()) errs.departamento = true;
      if (!form.ciudad.trim()) errs.ciudad = true;
    }
    if (s === 4) {
      if (photos.length < 1) errs.photos = true;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  // ---- Publish ----
  const publishMutation = useMutation({
    mutationFn: async () => {
      // 1. Insert lote
      const { data: lote, error: loteErr } = await supabase
        .from("lotes")
        .insert({
          nombre_lote: form.nombre_lote,
          nombre_propietario: form.nombre_propietario || null,
          tipo_lote: form.tipo_lote,
          area_total_m2: form.area_total_m2
            ? parseFloat(form.area_total_m2)
            : null,
          frente_ml: form.frente_ml ? parseFloat(form.frente_ml) : null,
          fondo_ml: form.fondo_ml ? parseFloat(form.fondo_ml) : null,
          notas: form.notas || null,
          departamento: form.departamento || null,
          ciudad: form.ciudad || null,
          barrio: form.barrio || null,
          direccion: form.direccion || null,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null,
          tiene_escritura:
            form.tiene_escritura === "si"
              ? true
              : form.tiene_escritura === "no"
                ? false
                : null,
          tiene_deudas: form.tiene_deudas || null,
          problema_juridico: form.problema_juridico || null,
          video_url: videoUrl || null,
          estado_disponibilidad: "En revisión" as any,
          owner_id: user?.id || null,
          es_publico: false,
        } as any)
        .select("id")
        .single();
      if (loteErr) throw loteErr;
      const loteId = lote.id;

      // 2. Precio
      if (form.precio_cop) {
        const area = parseFloat(form.area_total_m2) || 1;
        await supabase.from("precios").insert({
          lote_id: loteId,
          precio_cop: parseInt(form.precio_cop),
          precio_m2_cop: Math.round(parseInt(form.precio_cop) / area),
          vigencia: new Date().toISOString().split("T")[0],
        });
      }

      // 3. Normativa
      if (form.uso_principal) {
        await supabase.from("normativa_urbana").insert({
          lote_id: loteId,
          uso_principal: form.uso_principal,
        });
      }

      // 4. Servicios
      const serviciosToInsert = Object.entries(form.servicios)
        .filter(([, v]) => v)
        .map(([tipo]) => ({
          lote_id: loteId,
          tipo,
          estado: "Disponible" as any,
        }));
      if (serviciosToInsert.length) {
        await supabase.from("servicios_publicos").insert(serviciosToInsert);
      }

      // 5. Photos
      for (let i = 0; i < photos.length; i++) {
        const f = photos[i];
        const ext = f.name.split(".").pop();
        const path = `${loteId}/foto-${i}.${ext}`;
        await supabase.storage
          .from("fotos-lotes")
          .upload(path, f, { upsert: true });
        const { data: urlData } = supabase.storage
          .from("fotos-lotes")
          .getPublicUrl(path);
        await supabase.from("fotos_lotes" as any).insert({
          lote_id: loteId,
          url: urlData.publicUrl,
          orden: i,
        });
        // Set first photo as main
        if (i === 0) {
          await supabase
            .from("lotes")
            .update({ foto_url: urlData.publicUrl } as any)
            .eq("id", loteId);
        }
      }

      // 6. Video file upload
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const path = `${loteId}/video.${ext}`;
        await supabase.storage
          .from("fotos-lotes")
          .upload(path, videoFile, { upsert: true });
        const { data: urlData } = supabase.storage
          .from("fotos-lotes")
          .getPublicUrl(path);
        await supabase
          .from("lotes")
          .update({ video_url: urlData.publicUrl } as any)
          .eq("id", loteId);
      }

      // 7. Documents
      for (const doc of docs) {
        const path = `${loteId}/${doc.file.name}`;
        await supabase.storage
          .from("documentos")
          .upload(path, doc.file, { upsert: true });
        await supabase.from("analisis_documentos").insert({
          lote_id: loteId,
          nombre: doc.file.name,
          categoria: mapCategoria(doc.categoria),
          tipo_archivo: doc.file.type,
        });
      }

      return loteId;
    },
    onSuccess: () => setPublished(true),
    onError: (err: any) =>
      toast({
        title: "Error al publicar",
        description: err.message,
        variant: "destructive",
      }),
  });

  const mapCategoria = (cat: string) => {
    const map: Record<string, string> = {
      Escritura: "juridico",
      "Plano topográfico": "tecnico",
      "Certificado de tradición": "juridico",
      "Estudio ambiental": "tecnico",
      Otro: "otro",
    };
    return (map[cat] || "otro") as any;
  };

  const handlePublish = () => {
    if (validateStep(4)) publishMutation.mutate();
  };

  // ---- Confirmation screen ----
  if (published) {
    const serviciosCount = Object.values(form.servicios).filter(Boolean).length;
    const scoreResult = calculateLoteScore({
      tiene_escritura: form.tiene_escritura,
      departamento: form.departamento,
      ciudad: form.ciudad,
      area_total_m2: form.area_total_m2,
      photosCount: photos.length,
      precio_cop: form.precio_cop,
      serviciosCount,
      tiene_deudas: form.tiene_deudas,
      problema_juridico: form.problema_juridico,
      docsCount: docs.length,
      matricula_inmobiliaria: "",
    });

    return (
      <DashboardLayout>
        <h1 className="mb-6 font-body text-xl font-bold text-foreground">
          ¡Tu lote fue enviado exitosamente!
        </h1>
        <p className="mb-6 text-center font-body text-sm text-muted-foreground">
          El equipo 360 Lateral lo revisará en menos de 24 horas. Mientras tanto, revisa el estado de tu publicación:
        </p>
        <LoteScoreResult result={scoreResult} />
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="default" asChild>
            <Link to="/dashboard/owner">Ver mis lotes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/diagnostico">Solicitar Diagnóstico 360°</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // ---- Progress bar ----
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <div key={s.num} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      step > s.num - 1 ? "bg-success" : "bg-accent"
                    }`}
                  />
                )}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-sm font-bold transition-colors ${
                    isCompleted
                      ? "bg-success text-primary-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      step > s.num ? "bg-success" : "bg-accent"
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-1 text-center font-body text-xs ${
                  isActive
                    ? "font-semibold text-primary"
                    : isCompleted
                      ? "font-medium text-success"
                      : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const errClass = (field: string) =>
    errors[field] ? "border-destructive" : "";

  // ---- Step 1 ----
  const Step1 = () => (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div>
          <Label className="text-xs">
            Nombre del lote <span className="text-destructive">*</span>
          </Label>
          <Input
            className={errClass("nombre_lote")}
            value={form.nombre_lote}
            onChange={(e) => update("nombre_lote", e.target.value)}
            placeholder="Ej: Lote La Pradera"
          />
        </div>
        <div>
          <Label className="text-xs">
            Nombre del propietario <span className="text-destructive">*</span>
          </Label>
          <Input
            className={errClass("nombre_propietario")}
            value={form.nombre_propietario}
            onChange={(e) => update("nombre_propietario", e.target.value)}
            placeholder="Ej: Juan Pérez o Constructora XYZ"
          />
        </div>
        <div>
          <Label className="text-xs">
            Tipo de lote <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.tipo_lote || undefined}
            onValueChange={(v) => update("tipo_lote", v)}
          >
            <SelectTrigger className={errClass("tipo_lote")}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Urbano">Urbano</SelectItem>
              <SelectItem value="Rural">Rural</SelectItem>
              <SelectItem value="Expansión urbana">Expansión urbana</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs">
              Área en m² <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              className={errClass("area_total_m2")}
              value={form.area_total_m2}
              onChange={(e) => update("area_total_m2", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Frente en metros</Label>
            <Input
              type="number"
              value={form.frente_ml}
              onChange={(e) => update("frente_ml", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Fondo en metros</Label>
            <Input
              type="number"
              value={form.fondo_ml}
              onChange={(e) => update("fondo_ml", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">
            Precio total en COP <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            className={errClass("precio_cop")}
            value={form.precio_cop}
            onChange={(e) => update("precio_cop", e.target.value)}
            placeholder="Ej: 350000000"
           />
          {form.precio_cop && (
            <p className="mt-1 font-body text-xs text-muted-foreground">
              = ${parseInt(form.precio_cop).toLocaleString("es-CO")} COP
              {form.area_total_m2 && ` · $${Math.round(
                parseInt(form.precio_cop) / parseFloat(form.area_total_m2)
              ).toLocaleString("es-CO")}/m²`}
            </p>
          )}
        </div>
        <div>
          <Label className="text-xs">Descripción del lote (opcional)</Label>
          <Textarea
            value={form.notas}
            onChange={(e) => update("notas", e.target.value)}
            placeholder="Describe las características principales del lote..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  // ---- Step 2 ----
  const Step2 = () => (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">
              Departamento <span className="text-destructive">*</span>
            </Label>
            <Input
              className={errClass("departamento")}
              value={form.departamento}
              onChange={(e) => update("departamento", e.target.value)}
              placeholder="Ej: Antioquia"
            />
          </div>
          <div>
            <Label className="text-xs">
              Municipio <span className="text-destructive">*</span>
            </Label>
            <Input
              className={errClass("ciudad")}
              value={form.ciudad}
              onChange={(e) => update("ciudad", e.target.value)}
              placeholder="Ej: Medellín"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Barrio o vereda</Label>
          <Input
            value={form.barrio}
            onChange={(e) => update("barrio", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Dirección aproximada</Label>
          <Input
            value={form.direccion}
            onChange={(e) => update("direccion", e.target.value)}
            placeholder="No se mostrará exacta por seguridad"
          />
          <p className="mt-1 font-body text-xs text-muted-foreground">
            🔒 La dirección exacta no se mostrará públicamente por seguridad.
          </p>
        </div>
        <div>
          <Label className="mb-2 block text-xs">
            Marca la ubicación aproximada en el mapa
          </Label>
          {isLoaded && mapsKey ? (
            <div className="h-56 w-full rounded-lg overflow-hidden">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: parseFloat(form.lat) || 6.253, lng: parseFloat(form.lng) || -75.5736 }}
                zoom={13}
                options={{ mapTypeId: "hybrid" as google.maps.MapTypeId, mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
                onClick={handleMapClick}
              >
                {form.lat && form.lng && (
                  <MarkerF
                    position={{ lat: parseFloat(form.lat), lng: parseFloat(form.lng) }}
                    draggable
                    onDragEnd={(e) => {
                      if (!e.latLng) return;
                      setForm((p) => ({ ...p, lat: e.latLng!.lat().toFixed(6), lng: e.latLng!.lng().toFixed(6) }));
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          ) : (
            <div className="h-56 w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">Cargando mapa…</div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Latitud</Label>
              <Input
                value={form.lat}
                onChange={(e) => update("lat", e.target.value)}
                placeholder="6.2530"
              />
            </div>
            <div>
              <Label className="text-xs">Longitud</Label>
              <Input
                value={form.lng}
                onChange={(e) => update("lng", e.target.value)}
                placeholder="-75.5736"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ---- Step 3 ----
  const Step3 = () => (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div>
          <Label className="text-xs">Uso de suelo</Label>
          <Select
            value={form.uso_principal || undefined}
            onValueChange={(v) => update("uso_principal", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Residencial">Residencial</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Dotacional">Dotacional</SelectItem>
              <SelectItem value="Rural">Rural</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block text-xs">Servicios disponibles</Label>
          <div className="flex flex-wrap gap-4">
            {Object.keys(form.servicios).map((s) => (
              <label
                key={s}
                className="flex items-center gap-2 font-body text-sm"
              >
                <Checkbox
                  checked={form.servicios[s]}
                  onCheckedChange={() => toggleServicio(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs">
            ¿Tiene escritura pública?
          </Label>
          <RadioGroup
            value={form.tiene_escritura}
            onValueChange={(v) => update("tiene_escritura", v)}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="si" /> Sí
            </label>
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="no" /> No
            </label>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-2 block text-xs">
            ¿Tiene deudas o gravámenes?
          </Label>
          <RadioGroup
            value={form.tiene_deudas}
            onValueChange={(v) => update("tiene_deudas", v)}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="si" /> Sí
            </label>
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="no" /> No
            </label>
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="no_se" /> No sé
            </label>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-2 block text-xs">
            ¿Tiene algún problema jurídico?
          </Label>
          <RadioGroup
            value={form.problema_juridico}
            onValueChange={(v) => update("problema_juridico", v)}
            className="flex gap-4"
          >
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="si" /> Sí
            </label>
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="no" /> No
            </label>
            <label className="flex items-center gap-2 font-body text-sm">
              <RadioGroupItem value="no_se" /> No sé
            </label>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-xs">Observaciones técnicas (opcional)</Label>
          <Textarea
            value={form.observaciones}
            onChange={(e) => update("observaciones", e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

  // ---- Step 4 ----
  const DOC_CATEGORIES = [
    "Escritura",
    "Plano topográfico",
    "Certificado de tradición",
    "Estudio ambiental",
    "Otro",
  ];

  const Step4 = () => (
    <div className="flex flex-col gap-6">
      {/* Photos */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Label className="text-sm font-semibold">
            Fotos del lote <span className="text-destructive">*</span>
            <span className="ml-2 font-normal text-muted-foreground">
              (mín. 1, máx. 10)
            </span>
          </Label>
          {errors.photos && (
            <p className="font-body text-sm text-destructive">
              Sube al menos una foto del lote.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photoPreviews.map((src, i) => (
              <div key={i} className="group relative">
                <img
                  src={src}
                  alt={`Foto ${i + 1}`}
                  className="h-24 w-full rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 hidden rounded bg-destructive p-1 text-primary-foreground group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-foreground/60 px-1 font-body text-[10px] text-primary-foreground">
                  {i + 1}
                </span>
              </div>
            ))}
            {photos.length < 10 && (
              <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="font-body text-[10px] text-muted-foreground">
                  Agregar
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={handlePhotos}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Label className="text-sm font-semibold">
            Video del lote (opcional)
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={videoMode === "upload" ? "default" : "outline"}
              onClick={() => setVideoMode("upload")}
            >
              <Upload className="mr-1 h-4 w-4" /> Subir archivo
            </Button>
            <Button
              type="button"
              size="sm"
              variant={videoMode === "link" ? "default" : "outline"}
              onClick={() => setVideoMode("link")}
            >
              🔗 Pegar link
            </Button>
          </div>
          {videoMode === "upload" ? (
            <div>
              {videoFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border p-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 truncate font-body text-sm">
                    {videoFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="font-body text-xs text-muted-foreground">
                    MP4, máximo 100MB
                  </span>
                  <input
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size <= 100 * 1024 * 1024) setVideoFile(f);
                      else if (f)
                        toast({
                          title: "El video excede 100MB",
                          variant: "destructive",
                        });
                    }}
                  />
                </label>
              )}
            </div>
          ) : (
            <Input
              placeholder="https://youtube.com/... o link de Drive"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <Label className="text-sm font-semibold">
            Documentos (opcional)
          </Label>
          {docs.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-border p-2"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate font-body text-sm">
                {d.file.name}
              </span>
              <span className="rounded bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground">
                {d.categoria}
              </span>
              <button
                type="button"
                onClick={() => removeDoc(i)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {DOC_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-muted/50 px-3 py-1.5 font-body text-xs transition-colors hover:bg-muted"
              >
                <Upload className="h-3 w-3" />
                {cat}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleDocAdd(e, cat)}
                />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <h1 className="mb-4 font-body text-xl font-bold text-foreground">
        Publicar mi lote
      </h1>

      <ProgressBar />

      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
      {step === 4 && <Step4 />}

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={goPrev}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
        ) : (
          <div />
        )}
        {step < 4 ? (
          <Button type="button" onClick={goNext}>
            Siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Subiendo fotos y documentos...
              </span>
            ) : "Publicar mi lote"}
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoteWizard;
