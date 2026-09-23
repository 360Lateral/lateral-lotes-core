import { useState, useMemo, useEffect, useRef, ChangeEvent, useCallback } from "react";
import { useLoteWizardDraft, formatRelativoDraft } from "@/hooks/wizard/useLoteWizardDraft";
import { AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import MemoizedLoteMap from "@/components/maps/MemoizedLoteMap";
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
  Cloud, Building2, Ruler, Lock, Landmark, MapPin, Layers, Scale, Video, FolderOpen,
  Star, Send, Droplets, Zap, Flame, Waves, Route,
} from "lucide-react";
import { WizardSection, ChoiceSegment, ServiceTile, FieldLabel } from "@/components/wizard/WizardUI";
import { calculateLoteScore } from "@/lib/loteScore";
import { DEPARTAMENTO_NOMBRES, getMunicipios } from "@/lib/colombiaData";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { BarrioCombobox } from "@/components/wizard/BarrioCombobox";
import LoteScoreResult from "@/components/LoteScoreResult";
import { formatCOP } from "@/lib/format-moneda";


const STEPS = [
  { num: 1, label: "Datos básicos" },
  { num: 2, label: "Ubicación" },
  { num: 3, label: "Información técnica" },
  { num: 4, label: "Fotos y documentos" },
];

export interface WizardForm {
  // Step 1
  nombre_lote: string;
  nombre_propietario: string;
  tipo_lote: string;
  area_total_m2: string;
  frente_ml: string;
  fondo_ml: string;
  precio_cop: string;
  notas: string;
  // Adquisición (opcional)
  precio_compra_original: string;
  fecha_compra: string;
  moneda_compra: string;
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
  precio_compra_original: "",
  fecha_compra: "",
  moneda_compra: "COP",
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

/**
 * Wizard de creación de lotes.
 *
 * PERSISTENCIA:
 *   El form se guarda automáticamente en localStorage (debounce 400ms) por usuario.
 *   Si el usuario sale a otra ruta y vuelve, encuentra el draft con un banner
 *   "Continuar borrador / Empezar nuevo".
 *
 *   IMPORTANTE: los archivos (fotos, video, documentos) NO se persisten porque
 *   los File objects no son serializables a JSON. El usuario debe re-seleccionarlos.
 *
 *   El draft se limpia automáticamente al crear el lote exitosamente o al click
 *   "Empezar nuevo".
 *
 *   Key de localStorage: `lote-wizard-draft-{userId}` (per-user para evitar
 *   mezclas en navegadores compartidos).
 */
const LoteWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isPropietario, isComisionista, isAdminOrExperto } = useAuth();
  // Propietarios/comisionistas (reales o simulados en modo pruebas) envían el lote a validación
  const requiereValidacion = (isPropietario || isComisionista) && !isAdminOrExperto;
  const { draftInicial, draftCargado, guardarDraft, limpiarDraft } = useLoteWizardDraft();

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
  const [mostrarBannerDraft, setMostrarBannerDraft] = useState(false);

  // Al encontrar un borrador, se restaura AUTOMÁTICAMENTE (sin esperar
  // decisión). El banner solo informa y permite empezar de nuevo.
  const [draftAplicado, setDraftAplicado] = useState(false);
  useEffect(() => {
    if (!draftCargado || draftAplicado) return;
    if (draftInicial) {
      setStep(draftInicial.step);
      setForm(draftInicial.form);
      setPublished(draftInicial.published);
      setVideoMode(draftInicial.videoMode);
      setVideoUrl(draftInicial.videoUrl);
      setMostrarBannerDraft(true);
    }
    setDraftAplicado(true);
  }, [draftCargado, draftInicial, draftAplicado]);

  const continuarBorrador = () => setMostrarBannerDraft(false);

  const descartarBorrador = () => {
    limpiarDraft();
    setStep(1);
    setForm(emptyWizard);
    setPublished(false);
    setVideoMode("upload");
    setVideoUrl("");
    setMostrarBannerDraft(false);
  };

  // Autosave: solo después de haber restaurado el borrador (evita
  // sobrescribirlo con el formulario vacío al entrar a la página).
  useEffect(() => {
    if (!draftAplicado || published) return;
    guardarDraft({ step, form, published, videoMode, videoUrl });
  }, [step, form, published, videoMode, videoUrl, draftAplicado, guardarDraft]);

  // Aviso defensivo al cerrar pestaña si hay datos digitados
  useEffect(() => {
    const hayDatos = Boolean(
      form.nombre_lote || form.area_total_m2 || form.departamento
    );
    if (!hayDatos || published) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form, published]);

  const update = (key: keyof WizardForm, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const toggleServicio = (s: string) =>
    setForm((p) => ({
      ...p,
      servicios: { ...p.servicios, [s]: !p.servicios[s] },
    }));

  // ---- Ubicación: origen del pin ----
  const [origenPin, setOrigenPin] = useState<"auto" | "manual" | null>(null);
  const [geoFallo, setGeoFallo] = useState(false);
  const [editarCoords, setEditarCoords] = useState(false);
  const [geoQuery, setGeoQuery] = useState("");
  const origenRef = useRef(origenPin);
  origenRef.current = origenPin;
  const ciudadPrevRef = useRef<string | null>(null);

  const handleMapClick = useCallback((e: any) => {
    if (!e.latLng) return;
    setOrigenPin("manual");
    setForm((p) => ({
      ...p,
      lat: e.latLng!.lat().toFixed(6),
      lng: e.latLng!.lng().toFixed(6),
    }));
  }, []);

  const handleGeocoded = useCallback((r: { lat: number; lng: number; ok: boolean }) => {
    setGeoFallo(!r.ok);
    if (!r.ok || origenRef.current === "manual") return;
    setOrigenPin("auto");
    setForm((prev) => ({ ...prev, lat: r.lat.toFixed(6), lng: r.lng.toFixed(6) }));
  }, []);

  const handlePlaceSelect = useCallback((p: { lat: number; lng: number; address?: string }) => {
    setOrigenPin("auto");
    setForm((prev) => ({
      ...prev,
      lat: p.lat.toFixed(6),
      lng: p.lng.toFixed(6),
      direccion: prev.direccion || (p.address ?? "").replace(/, Colombia$/, ""),
    }));
  }, []);

  const handleMarkerDragEnd = useCallback((e: any) => {
    if (!e.latLng) return;
    setOrigenPin("manual");
    setForm((p) => ({
      ...p,
      lat: e.latLng!.lat().toFixed(6),
      lng: e.latLng!.lng().toFixed(6),
    }));
  }, []);

  // Búsqueda automática en el mapa a partir de los datos de ubicación
  useEffect(() => {
    if (!form.ciudad) return;
    const primeraVez = ciudadPrevRef.current === null;
    const ciudadCambio = !primeraVez && ciudadPrevRef.current !== form.ciudad;
    if (primeraVez && form.lat && form.lng && origenRef.current === null) {
      // Coordenadas recuperadas de un borrador: se respetan como confirmadas
      origenRef.current = "manual";
      setOrigenPin("manual");
    }
    ciudadPrevRef.current = form.ciudad;
    if (ciudadCambio && origenRef.current === "manual") {
      setOrigenPin(null);
      toast({ title: "Cambiaste de municipio", description: "Reubicamos el pin; ajústalo de nuevo al punto exacto." });
    }
    const q = [form.direccion, form.barrio, form.ciudad, form.departamento, "Colombia"]
      .map((x) => x?.trim())
      .filter(Boolean)
      .join(", ");
    const t = setTimeout(() => setGeoQuery(q), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ciudad, form.departamento, form.barrio, form.direccion]);

  const geoZoom = form.direccion.trim() ? 17 : form.barrio.trim() ? 15 : 13;
  const pinConfirmado = !!form.lat && !!form.lng && origenPin !== "auto";

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
          precio_compra_original: form.precio_compra_original
            ? parseFloat(form.precio_compra_original)
            : null,
          fecha_compra: form.fecha_compra || null,
          moneda_compra: form.precio_compra_original ? form.moneda_compra : null,
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
          ...(requiereValidacion
            ? {
                publicado_venta: true,
                estado_publicacion: "pendiente_validacion",
                ...(isPropietario ? { propietario_id: user?.id ?? null } : {}),
              }
            : {}),
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
    onSuccess: () => {
      limpiarDraft();
      setPublished(true);
    },
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
            <Link to="/portal">Ver mis lotes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/diagnostico">Solicitar Diagnóstico 360°</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const errClass = (field: string) =>
    errors[field] ? "border-destructive" : "";

  const DOC_CATEGORIES = [
    "Escritura",
    "Plano topográfico",
    "Certificado de tradición",
    "Estudio ambiental",
    "Otro",
  ];

  const STEP_META: Record<number, { title: string; desc: string; mins: string }> = {
    1: { title: "Datos del activo", desc: "Identifica el lote y define su valor.", mins: "2 min" },
    2: { title: "Ubicación", desc: "Jurisdicción y georreferenciación del predio.", mins: "1 min" },
    3: { title: "Información técnica", desc: "Uso de suelo, servicios y estado jurídico.", mins: "2 min" },
    4: { title: "Fotos y documentos", desc: "Galería y expediente para la validación.", mins: "3 min" },
  };
  const progreso = Math.round(((step - 1) / STEPS.length) * 100);
  const precioNum = parseInt(form.precio_cop);
  const areaNum = parseFloat(form.area_total_m2);
  const SERVICIO_ICONS: Record<string, any> = {
    Agua: Droplets,
    Energía: Zap,
    Gas: Flame,
    Alcantarillado: Waves,
    "Vía pavimentada": Route,
  };
  const SI_NO = [
    { value: "si", label: "Sí" },
    { value: "no", label: "No" },
  ];
  const SI_NO_NS = [...SI_NO, { value: "no_se", label: "No sé" }];

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl pb-28">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-primary">
              Publicación de activo
            </p>
            <h1 className="mt-1 font-body text-2xl font-bold text-foreground">Publicar mi lote</h1>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-body text-xs text-muted-foreground">
            <Cloud className="h-3.5 w-3.5 text-success" />
            Borrador guardado automáticamente
          </span>
        </div>

        {mostrarBannerDraft && draftInicial && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-start">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
            <div className="flex-1">
              <p className="font-body text-sm font-semibold text-foreground">Recuperamos tu borrador</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Última edición: {formatRelativoDraft(draftInicial.savedAt)} · Paso {draftInicial.step} de 4
              </p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Los archivos (fotos, video, documentos) NO se conservan — solo los datos digitados.
              </p>
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <Button size="sm" onClick={continuarBorrador}>Entendido</Button>
              <Button size="sm" variant="outline" onClick={descartarBorrador}>Empezar nuevo</Button>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between font-body text-xs">
            <span className="font-semibold text-foreground">
              Paso {step} de {STEPS.length} · {STEP_META[step].title}
            </span>
            <span className="text-muted-foreground">Aprox. {STEP_META[step].mins} · {progreso}% completado</span>
          </div>
          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(progreso, 4)}%` }}
            />
          </div>
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <li key={s.num} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:text-left">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-xs font-bold transition-colors ${
                      isCompleted
                        ? "bg-secondary text-secondary-foreground"
                        : isActive
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                  </span>
                  <span
                    className={`font-body text-[11px] leading-tight sm:text-xs ${
                      isActive ? "font-semibold text-foreground" : isCompleted ? "text-secondary" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="mb-4 font-body text-sm text-muted-foreground">{STEP_META[step].desc}</p>

        {/* Step 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <WizardSection icon={Building2} title="Identificación general" description="Cómo se reconocerá el activo en la plataforma.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Nombre del lote</FieldLabel>
                  <Input className={errClass("nombre_lote")} value={form.nombre_lote} onChange={(e) => update("nombre_lote", e.target.value)} placeholder="Ej: Lote La Pradera" />
                </div>
                <div>
                  <FieldLabel required>Nombre del propietario</FieldLabel>
                  <Input className={errClass("nombre_propietario")} value={form.nombre_propietario} onChange={(e) => update("nombre_propietario", e.target.value)} placeholder="Ej: Juan Pérez o Constructora XYZ" />
                </div>
              </div>
              <div>
                <FieldLabel required>Tipo de lote</FieldLabel>
                <ChoiceSegment
                  value={form.tipo_lote}
                  onChange={(v) => update("tipo_lote", v)}
                  options={[
                    { value: "Urbano", label: "Urbano" },
                    { value: "Rural", label: "Rural" },
                    { value: "Expansión urbana", label: "Expansión urbana" },
                  ]}
                />
                {errors.tipo_lote && <p className="mt-1 font-body text-xs text-destructive">Selecciona el tipo de lote.</p>}
              </div>
              <div>
                <FieldLabel>Descripción del lote (opcional)</FieldLabel>
                <Textarea value={form.notas} onChange={(e) => update("notas", e.target.value)} placeholder="Describe las características principales del lote..." rows={3} />
              </div>
            </WizardSection>

            <WizardSection icon={Ruler} title="Métricas y valor" description="Superficie y precio de venta esperado.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel required>Área total m²</FieldLabel>
                  <Input type="number" className={errClass("area_total_m2")} value={form.area_total_m2} onChange={(e) => update("area_total_m2", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Frente (m)</FieldLabel>
                  <Input type="number" value={form.frente_ml} onChange={(e) => update("frente_ml", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Fondo (m)</FieldLabel>
                  <Input type="number" value={form.fondo_ml} onChange={(e) => update("fondo_ml", e.target.value)} />
                </div>
              </div>
              <div>
                <FieldLabel required>Precio total en COP</FieldLabel>
                <Input type="number" className={errClass("precio_cop")} value={form.precio_cop} onChange={(e) => update("precio_cop", e.target.value)} placeholder="Ej: 350000000" />
                {precioNum > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
                      <p className="font-body text-[11px] uppercase tracking-wide opacity-70">Precio total</p>
                      <p className="font-body text-lg font-bold">{formatCOP(precioNum)}</p>
                    </div>
                    {areaNum > 0 && (
                      <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                        <p className="font-body text-[11px] uppercase tracking-wide text-muted-foreground">Valor por m²</p>
                        <p className="font-body text-lg font-bold text-foreground">{formatCOP(Math.round(precioNum / areaNum))}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </WizardSection>

            <WizardSection icon={Lock} title="Información de adquisición" description="Opcional. Solo la ves tú; se usa para calcular la plusvalía de tu portafolio.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel>Precio de compra original</FieldLabel>
                  <Input type="number" value={form.precio_compra_original} onChange={(e) => update("precio_compra_original", e.target.value)} placeholder="Ej: 500000000" />
                </div>
                <div>
                  <FieldLabel>Fecha de compra</FieldLabel>
                  <Input type="date" value={form.fecha_compra} onChange={(e) => update("fecha_compra", e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Moneda</FieldLabel>
                  <Select value={form.moneda_compra} onValueChange={(v) => update("moneda_compra", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">COP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </WizardSection>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <WizardSection icon={MapPin} title="Ubicación del predio" description="Completa los datos y el mapa buscará la zona. Luego solo ajusta el pin al punto exacto del lote.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Departamento</FieldLabel>
                <SearchableSelect
                  options={DEPARTAMENTO_NOMBRES}
                  value={form.departamento}
                  onValueChange={(v) => {
                    update("departamento", v);
                    if (v !== form.departamento) update("ciudad", "");
                  }}
                  placeholder="Seleccionar departamento"
                  searchPlaceholder="Buscar departamento..."
                  emptyText="Departamento no encontrado."
                  className={errClass("departamento")}
                />
              </div>
              <div>
                <FieldLabel required>Municipio</FieldLabel>
                <SearchableSelect
                  options={getMunicipios(form.departamento)}
                  value={form.ciudad}
                  onValueChange={(v) => update("ciudad", v)}
                  placeholder="Seleccionar municipio"
                  searchPlaceholder="Buscar municipio..."
                  emptyText="Municipio no encontrado."
                  className={errClass("ciudad")}
                  disabled={!form.departamento}
                />
              </div>
              <div>
                <FieldLabel>Barrio o vereda</FieldLabel>
                <BarrioCombobox
                  departamento={form.departamento}
                  ciudad={form.ciudad}
                  value={form.barrio}
                  onChange={(v) => update("barrio", v)}
                />
              </div>
              <div>
                <FieldLabel>Dirección aproximada</FieldLabel>
                <Input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} placeholder="Ej: CL 50 30 20" />
              </div>
            </div>
            <p className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> La dirección exacta no se mostrará públicamente por seguridad.
            </p>

            <GoogleMapsGate
              fallback={<div className="flex h-72 w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">Cargando mapa…</div>}
            >
              <MemoizedLoteMap
                lat={form.lat}
                lng={form.lng}
                onMapClick={handleMapClick}
                onMarkerDragEnd={handleMarkerDragEnd}
                onPlaceSelect={handlePlaceSelect}
                geocodeQuery={geoQuery}
                geocodeZoom={geoZoom}
                onGeocoded={handleGeocoded}
              />
            </GoogleMapsGate>

            {pinConfirmado ? (
              <p className="flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-2 font-body text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> Ubicación confirmada
              </p>
            ) : form.lat ? (
              <p className="flex items-center gap-1.5 rounded-md bg-warning/10 px-3 py-2 font-body text-sm font-medium text-foreground">
                <AlertCircle className="h-4 w-4 text-warning" /> Ubicación aproximada — arrastra el pin o haz clic en el punto exacto del lote
              </p>
            ) : geoFallo ? (
              <p className="flex items-center gap-1.5 rounded-md bg-warning/10 px-3 py-2 font-body text-sm text-foreground">
                <AlertCircle className="h-4 w-4 text-warning" /> No encontramos la dirección exacta; ubica el pin manualmente haciendo clic en el mapa
              </p>
            ) : (
              <p className="font-body text-xs text-muted-foreground">Elige departamento y municipio para centrar el mapa, o haz clic en el mapa para poner el pin.</p>
            )}

            <div className="flex flex-wrap items-center gap-2 font-body text-xs text-muted-foreground">
              <span>{form.lat && form.lng ? `${form.lat}, ${form.lng}` : "Sin coordenadas"}</span>
              <span>·</span>
              <button type="button" className="font-medium text-secondary underline-offset-2 hover:underline" onClick={() => setEditarCoords((v) => !v)}>
                {editarCoords ? "Ocultar coordenadas" : "Editar coordenadas"}
              </button>
            </div>
            {editarCoords && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Latitud</FieldLabel>
                  <Input value={form.lat} onChange={(e) => { setOrigenPin("manual"); update("lat", e.target.value); }} placeholder="6.2530" />
                </div>
                <div>
                  <FieldLabel>Longitud</FieldLabel>
                  <Input value={form.lng} onChange={(e) => { setOrigenPin("manual"); update("lng", e.target.value); }} placeholder="-75.5736" />
                </div>
              </div>
            )}
          </WizardSection>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <WizardSection icon={Layers} title="Norma y servicios" description="Uso de suelo y servicios públicos disponibles.">
              <div>
                <FieldLabel>Uso de suelo</FieldLabel>
                <Select value={form.uso_principal || undefined} onValueChange={(v) => update("uso_principal", v)}>
                  <SelectTrigger className="sm:max-w-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
                <FieldLabel>Servicios disponibles</FieldLabel>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {Object.keys(form.servicios).map((s) => (
                    <ServiceTile key={s} label={s} icon={SERVICIO_ICONS[s] ?? Check} active={form.servicios[s]} onToggle={() => toggleServicio(s)} />
                  ))}
                </div>
              </div>
            </WizardSection>

            <WizardSection icon={Scale} title="Situación jurídica" description="Ayuda al equipo a validar el activo más rápido.">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-body text-sm font-medium text-foreground">¿Tiene escritura pública?</span>
                <ChoiceSegment value={form.tiene_escritura} onChange={(v) => update("tiene_escritura", v)} options={SI_NO} />
              </div>
              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-body text-sm font-medium text-foreground">¿Tiene deudas o gravámenes?</span>
                <ChoiceSegment value={form.tiene_deudas} onChange={(v) => update("tiene_deudas", v)} options={SI_NO_NS} />
              </div>
              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-body text-sm font-medium text-foreground">¿Tiene algún problema jurídico?</span>
                <ChoiceSegment value={form.problema_juridico} onChange={(v) => update("problema_juridico", v)} options={SI_NO_NS} />
              </div>
              <div className="border-t border-border pt-4">
                <FieldLabel>Observaciones técnicas (opcional)</FieldLabel>
                <Textarea value={form.observaciones} onChange={(e) => update("observaciones", e.target.value)} rows={3} />
              </div>
            </WizardSection>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <WizardSection
              icon={ImagePlus}
              title="Galería multimedia"
              description="Mínimo 1, máximo 10 fotos (JPG o PNG). La primera será la portada."
              aside={<span className="rounded-full bg-muted px-2.5 py-1 font-body text-xs font-semibold text-muted-foreground">{photos.length}/10</span>}
            >
              {errors.photos && <p className="font-body text-sm text-destructive">Sube al menos una foto del lote.</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photoPreviews.map((src, i) => (
                  <div key={i} className={`group relative overflow-hidden rounded-lg border border-border ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                    <img src={src} alt={`Foto ${i + 1}`} className={`w-full object-cover ${i === 0 ? "h-full min-h-48" : "h-24"}`} />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-body text-[11px] font-semibold text-primary-foreground">
                        <Star className="h-3 w-3" /> Portada
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Eliminar foto ${i + 1}`}
                      onClick={() => removePhoto(i)}
                      className="absolute right-2 top-2 rounded-md bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary hover:bg-primary/5 ${photos.length === 0 ? "col-span-2 h-40 sm:col-span-4" : "h-24"}`}>
                    <ImagePlus className="h-6 w-6 text-primary" />
                    <span className="font-body text-xs font-medium text-foreground">{photos.length === 0 ? "Agregar fotos del lote" : "Agregar"}</span>
                    {photos.length === 0 && <span className="font-body text-[11px] text-muted-foreground">JPG o PNG</span>}
                    <input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handlePhotos} />
                  </label>
                )}
              </div>
            </WizardSection>

            <WizardSection icon={Video} title="Video del lote" description="Opcional. Sube un archivo o pega un enlace.">
              <ChoiceSegment
                value={videoMode}
                onChange={(v) => setVideoMode(v as any)}
                options={[
                  { value: "upload", label: "Subir archivo" },
                  { value: "link", label: "Pegar enlace" },
                ]}
              />
              {videoMode === "upload" ? (
                videoFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <FileText className="h-5 w-5 text-secondary" />
                    <span className="flex-1 truncate font-body text-sm">{videoFile.name}</span>
                    <button type="button" aria-label="Quitar video" onClick={() => setVideoFile(null)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary hover:bg-primary/5">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="font-body text-xs text-muted-foreground">MP4, máximo 100MB</span>
                    <input
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f && f.size <= 100 * 1024 * 1024) setVideoFile(f);
                        else if (f) toast({ title: "El video excede 100MB", variant: "destructive" });
                      }}
                    />
                  </label>
                )
              ) : (
                <Input placeholder="https://youtube.com/... o link de Drive" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              )}
            </WizardSection>

            <WizardSection icon={FolderOpen} title="Expediente documental" description="Opcional, pero acelera la validación jurídica del activo.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOC_CATEGORIES.map((cat) => {
                  const adjuntos = docs.map((d, i) => ({ d, i })).filter(({ d }) => d.categoria === cat);
                  return (
                    <div key={cat} className={`rounded-lg border p-3 ${adjuntos.length ? "border-success/40 bg-success/5" : "border-border"}`}>
                      <div className="flex items-center gap-2">
                        {adjuntos.length ? <CheckCircle2 className="h-4 w-4 text-success" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 font-body text-sm font-medium text-foreground">{cat}</span>
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 font-body text-xs font-medium transition-colors hover:border-primary hover:text-primary">
                          <Upload className="h-3 w-3" /> Adjuntar
                          <input type="file" className="hidden" onChange={(e) => handleDocAdd(e, cat)} />
                        </label>
                      </div>
                      {adjuntos.map(({ d, i }) => (
                        <div key={i} className="mt-2 flex items-center gap-2 rounded-md bg-card px-2 py-1.5">
                          <span className="flex-1 truncate font-body text-xs text-muted-foreground">{d.file.name}</span>
                          <button type="button" aria-label="Quitar documento" onClick={() => removeDoc(i)} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </WizardSection>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={goPrev}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Volver
            </Button>
          ) : (
            <span className="font-body text-xs text-muted-foreground">Los campos con * son obligatorios</span>
          )}
          {step < 4 ? (
            <Button type="button" onClick={goNext} className="font-semibold">
              Continuar a {STEPS[step].label} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handlePublish} disabled={publishMutation.isPending} className="font-semibold">
              {publishMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Subiendo fotos y documentos...
                </span>
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" /> Enviar activo a validación
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LoteWizard;
