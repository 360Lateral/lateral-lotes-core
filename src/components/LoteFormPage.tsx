import { useState, useEffect, ChangeEvent, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import MemoizedLoteMap from "@/components/maps/MemoizedLoteMap";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, FileText, Scale, Leaf, Zap, Mountain, TrendingUp, Building2, Calculator, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";



const SERVICIOS_DEFAULT = [
  { tipo: "Agua", estado: "Disponible", operador: "" },
  { tipo: "Energía", estado: "Disponible", operador: "" },
  { tipo: "Gas", estado: "Disponible", operador: "" },
  { tipo: "Alcantarillado", estado: "Disponible", operador: "" },
  { tipo: "Internet", estado: "Disponible", operador: "" },
];

interface LoteForm {
  nombre_lote: string;
  nombre_propietario: string;
  ciudad: string;
  barrio: string;
  direccion: string;
  estrato: string;
  estado_disponibilidad: string;
  destacado: boolean;
  lat: string;
  lng: string;
  area_total_m2: string;
  matricula_inmobiliaria: string;
  notas: string;
  // Normativa
  uso_principal: string;
  usos_compatibles: string;
  indice_construccion: string;
  indice_ocupacion: string;
  altura_max_pisos: string;
  altura_max_metros: string;
  aislamiento_frontal_m: string;
  aislamiento_posterior_m: string;
  aislamiento_lateral_m: string;
  zona_pot: string;
  tratamiento: string;
  norma_vigente: string;
  cesion_tipo_a_pct: string;
  // Precio
  precio_cop: string;
  precio_m2_cop: string;
  // Scores
  score_juridico: string;
  score_normativo: string;
  score_servicios: string;
  es_publico: boolean;
}

const emptyForm: LoteForm = {
  nombre_lote: "",
  nombre_propietario: "",
  ciudad: "Medellín",
  barrio: "",
  direccion: "",
  estrato: "",
  estado_disponibilidad: "Disponible",
  destacado: false,
  lat: "",
  lng: "",
  area_total_m2: "",
  matricula_inmobiliaria: "",
  notas: "",
  uso_principal: "",
  usos_compatibles: "",
  indice_construccion: "",
  indice_ocupacion: "",
  altura_max_pisos: "",
  altura_max_metros: "",
  aislamiento_frontal_m: "",
  aislamiento_posterior_m: "",
  aislamiento_lateral_m: "",
  zona_pot: "",
  tratamiento: "",
  norma_vigente: "",
  cesion_tipo_a_pct: "",
  precio_cop: "",
  precio_m2_cop: "",
  score_juridico: "",
  score_normativo: "",
  score_servicios: "",
  es_publico: true,
};

interface ServicioRow {
  tipo: string;
  estado: string;
  operador: string;
}

const LoteFormPage = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminOrAsesor } = useAuth();

  const [form, setForm] = useState<LoteForm>(emptyForm);
  const [servicios, setServicios] = useState<ServicioRow[]>(SERVICIOS_DEFAULT);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);


  // Fetch existing data for edit mode
  const { data: existingLote } = useQuery({
    queryKey: ["edit-lote", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lotes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit && !!id,
  });

  const { data: existingNormativa } = useQuery({
    queryKey: ["edit-normativa", id],
    queryFn: async () => {
      const { data } = await supabase.from("normativa_urbana").select("*").eq("lote_id", id!).maybeSingle();
      return data;
    },
    enabled: isEdit && !!id,
  });

  const { data: existingServicios } = useQuery({
    queryKey: ["edit-servicios", id],
    queryFn: async () => {
      const { data } = await supabase.from("servicios_publicos").select("*").eq("lote_id", id!);
      return data ?? [];
    },
    enabled: isEdit && !!id,
  });

  const { data: existingPrecio } = useQuery({
    queryKey: ["edit-precio", id],
    queryFn: async () => {
      const { data } = await supabase.from("precios").select("*").eq("lote_id", id!).order("vigencia", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: isEdit && !!id,
  });

  const { data: estadoAnalisis } = useQuery({
    queryKey: ["estado-analisis", id],
    enabled: isEdit && !!id && isAdminOrAsesor,
    queryFn: async () => {
      const [juridico, ambiental, sspp, geotecnico, mercado, arquitectonico, financiero] = await Promise.all([
        supabase.from("analisis_juridico").select("id").eq("lote_id", id!).maybeSingle(),
        supabase.from("analisis_ambiental").select("id").eq("lote_id", id!).maybeSingle(),
        supabase.from("analisis_sspp").select("id").eq("lote_id", id!).maybeSingle(),
        supabase.from("analisis_geotecnico").select("id").eq("lote_id", id!).maybeSingle(),
        supabase.from("analisis_mercado").select("id").eq("lote_id", id!).maybeSingle(),
        supabase.from("analisis_arquitectonico").select("id").eq("lote_id", id!).maybeSingle(),
        supabase.from("analisis_financiero").select("id").eq("lote_id", id!).maybeSingle(),
      ]);
      return {
        normativo: !!existingNormativa,
        juridico: !!juridico.data,
        ambiental: !!ambiental.data,
        sspp: !!sspp.data,
        geotecnico: !!geotecnico.data,
        mercado: !!mercado.data,
        arquitectonico: !!arquitectonico.data,
        financiero: !!financiero.data,
      };
    },
  });

  // Populate form on edit
  useEffect(() => {
    if (!existingLote) return;
    setForm((prev) => ({
      ...prev,
      nombre_lote: existingLote.nombre_lote,
      nombre_propietario: (existingLote as any).nombre_propietario ?? "",
      ciudad: existingLote.ciudad ?? "Medellín",
      barrio: existingLote.barrio ?? "",
      direccion: existingLote.direccion ?? "",
      estrato: existingLote.estrato != null ? String(existingLote.estrato) : "",
      estado_disponibilidad: existingLote.estado_disponibilidad,
      destacado: existingLote.destacado ?? false,
      lat: existingLote.lat != null ? String(existingLote.lat) : "",
      lng: existingLote.lng != null ? String(existingLote.lng) : "",
      area_total_m2: existingLote.area_total_m2 != null ? String(existingLote.area_total_m2) : "",
      matricula_inmobiliaria: existingLote.matricula_inmobiliaria ?? "",
      notas: existingLote.notas ?? "",
      score_juridico: existingLote.score_juridico != null ? String(existingLote.score_juridico) : "",
      score_normativo: existingLote.score_normativo != null ? String(existingLote.score_normativo) : "",
      score_servicios: existingLote.score_servicios != null ? String(existingLote.score_servicios) : "",
      es_publico: existingLote.es_publico ?? true,
    }));
    if ((existingLote as any).foto_url) {
      setExistingPhotoUrl((existingLote as any).foto_url);
    }
  }, [existingLote]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setExistingPhotoUrl(null);
  };

  useEffect(() => {
    if (!existingNormativa) return;
    setForm((prev) => ({
      ...prev,
      uso_principal: existingNormativa.uso_principal ?? "",
      usos_compatibles: (existingNormativa.usos_compatibles ?? []).join(", "),
      indice_construccion: existingNormativa.indice_construccion != null ? String(existingNormativa.indice_construccion) : "",
      indice_ocupacion: existingNormativa.indice_ocupacion != null ? String(existingNormativa.indice_ocupacion) : "",
      altura_max_pisos: existingNormativa.altura_max_pisos != null ? String(existingNormativa.altura_max_pisos) : "",
      altura_max_metros: existingNormativa.altura_max_metros != null ? String(existingNormativa.altura_max_metros) : "",
      aislamiento_frontal_m: existingNormativa.aislamiento_frontal_m != null ? String(existingNormativa.aislamiento_frontal_m) : "",
      aislamiento_posterior_m: existingNormativa.aislamiento_posterior_m != null ? String(existingNormativa.aislamiento_posterior_m) : "",
      aislamiento_lateral_m: existingNormativa.aislamiento_lateral_m != null ? String(existingNormativa.aislamiento_lateral_m) : "",
      zona_pot: existingNormativa.zona_pot ?? "",
      tratamiento: existingNormativa.tratamiento ?? "",
      norma_vigente: existingNormativa.norma_vigente ?? "",
      cesion_tipo_a_pct: existingNormativa.cesion_tipo_a_pct != null ? String(existingNormativa.cesion_tipo_a_pct) : "",
    }));
  }, [existingNormativa]);

  useEffect(() => {
    if (!existingServicios || existingServicios.length === 0) return;
    const mapped = SERVICIOS_DEFAULT.map((def) => {
      const found = existingServicios.find((s) => s.tipo === def.tipo);
      return found ? { tipo: found.tipo, estado: found.estado, operador: found.operador ?? "" } : def;
    });
    setServicios(mapped);
  }, [existingServicios]);

  useEffect(() => {
    if (!existingPrecio) return;
    setForm((prev) => ({
      ...prev,
      precio_cop: existingPrecio.precio_cop != null ? String(existingPrecio.precio_cop) : "",
      precio_m2_cop: existingPrecio.precio_m2_cop != null ? String(existingPrecio.precio_m2_cop) : "",
    }));
  }, [existingPrecio]);

  const handleMapClick = useCallback((e: any) => {
    if (!e.latLng) return;
    setForm((prev) => ({
      ...prev,
      lat: e.latLng!.lat().toFixed(6),
      lng: e.latLng!.lng().toFixed(6),
    }));
  }, []);

  const handleMarkerDragEnd = useCallback((e: any) => {
    if (!e.latLng) return;
    setForm((prev) => ({
      ...prev,
      lat: e.latLng!.lat().toFixed(6),
      lng: e.latLng!.lng().toFixed(6),
    }));
  }, []);

  // Auto-calc price
  const handlePrecioChange = (field: "precio_cop" | "precio_m2_cop", value: string) => {
    const area = parseFloat(form.area_total_m2) || 0;
    if (field === "precio_cop" && area > 0) {
      const total = parseFloat(value) || 0;
      setForm((prev) => ({ ...prev, precio_cop: value, precio_m2_cop: total > 0 ? String(Math.round(total / area)) : "" }));
    } else if (field === "precio_m2_cop" && area > 0) {
      const pm2 = parseFloat(value) || 0;
      setForm((prev) => ({ ...prev, precio_m2_cop: value, precio_cop: pm2 > 0 ? String(Math.round(pm2 * area)) : "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const update = (key: keyof LoteForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateServicio = (idx: number, key: keyof ServicioRow, value: string) =>
    setServicios((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const lotePayload = {
        nombre_lote: form.nombre_lote,
        nombre_propietario: form.nombre_propietario || null,
        ciudad: form.ciudad || null,
        barrio: form.barrio || null,
        direccion: form.direccion || null,
        estrato: form.estrato ? parseInt(form.estrato) : null,
        estado_disponibilidad: form.estado_disponibilidad as any,
        destacado: form.destacado,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        area_total_m2: form.area_total_m2 ? parseFloat(form.area_total_m2) : null,
        frente_ml: form.frente_ml ? parseFloat(form.frente_ml) : null,
        fondo_ml: form.fondo_ml ? parseFloat(form.fondo_ml) : null,
        matricula_inmobiliaria: form.matricula_inmobiliaria || null,
        notas: form.notas || null,
        score_juridico: form.score_juridico ? parseInt(form.score_juridico) : null,
        score_normativo: form.score_normativo ? parseInt(form.score_normativo) : null,
        score_servicios: form.score_servicios ? parseInt(form.score_servicios) : null,
        es_publico: form.es_publico,
      };

      let loteId = id;

      if (isEdit && id) {
        const { error } = await supabase.from("lotes").update(lotePayload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("lotes").insert(lotePayload).select("id").single();
        if (error) throw error;
        loteId = data.id;
      }

      // Upload photo if selected
      if (photoFile && loteId) {
        const ext = photoFile.name.split(".").pop();
        const path = `${loteId}/foto.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("fotos-lotes").upload(path, photoFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("fotos-lotes").getPublicUrl(path);
        await supabase.from("lotes").update({ foto_url: urlData.publicUrl } as any).eq("id", loteId);
      } else if (!existingPhotoUrl && isEdit && id) {
        // Photo was removed
        await supabase.from("lotes").update({ foto_url: null } as any).eq("id", id);
      }

      // Normativa
      const normPayload = {
        lote_id: loteId!,
        uso_principal: form.uso_principal || null,
        usos_compatibles: form.usos_compatibles ? form.usos_compatibles.split(",").map((s) => s.trim()).filter(Boolean) : null,
        indice_construccion: form.indice_construccion ? parseFloat(form.indice_construccion) : null,
        indice_ocupacion: form.indice_ocupacion ? parseFloat(form.indice_ocupacion) : null,
        altura_max_pisos: form.altura_max_pisos ? parseInt(form.altura_max_pisos) : null,
        altura_max_metros: form.altura_max_metros ? parseFloat(form.altura_max_metros) : null,
        aislamiento_frontal_m: form.aislamiento_frontal_m ? parseFloat(form.aislamiento_frontal_m) : null,
        aislamiento_posterior_m: form.aislamiento_posterior_m ? parseFloat(form.aislamiento_posterior_m) : null,
        aislamiento_lateral_m: form.aislamiento_lateral_m ? parseFloat(form.aislamiento_lateral_m) : null,
        zona_pot: form.zona_pot || null,
        tratamiento: form.tratamiento || null,
        norma_vigente: form.norma_vigente || null,
        cesion_tipo_a_pct: form.cesion_tipo_a_pct ? parseFloat(form.cesion_tipo_a_pct) : null,
      };

      if (isEdit && existingNormativa) {
        await supabase.from("normativa_urbana").update(normPayload).eq("id", existingNormativa.id);
      } else {
        await supabase.from("normativa_urbana").insert(normPayload);
      }

      // Servicios: delete existing, re-insert
      if (isEdit) {
        await supabase.from("servicios_publicos").delete().eq("lote_id", loteId!);
      }
      const serviciosPayload = servicios.map((s) => ({
        lote_id: loteId!,
        tipo: s.tipo,
        estado: s.estado as any,
        operador: s.operador || null,
      }));
      await supabase.from("servicios_publicos").insert(serviciosPayload);

      // Precio
      if (form.precio_cop || form.precio_m2_cop) {
        const precioPayload = {
          lote_id: loteId!,
          precio_cop: form.precio_cop ? parseInt(form.precio_cop) : null,
          precio_m2_cop: form.precio_m2_cop ? parseInt(form.precio_m2_cop) : null,
          vigencia: new Date().toISOString().split("T")[0],
        };
        if (isEdit && existingPrecio) {
          await supabase.from("precios").update(precioPayload).eq("id", existingPrecio.id);
        } else {
          await supabase.from("precios").insert(precioPayload);
        }
      }

      return loteId;
    },
    onSuccess: () => {
      toast({ title: "Lote guardado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["dash-lotes-list"] });
      navigate("/dashboard/lotes");
    },
    onError: (err: any) => {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <h1 className="mb-6 font-body text-xl font-bold text-foreground">
        {isEdit ? "Editar lote" : "Nuevo lote"}
      </h1>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.nombre_lote.trim()) return;
          saveMutation.mutate();
        }}
      >
        {/* Información básica */}
        <Card>
          <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs">Nombre del lote *</Label>
              <Input required value={form.nombre_lote} onChange={(e) => update("nombre_lote", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Nombre del propietario</Label>
              <Input value={form.nombre_propietario} onChange={(e) => update("nombre_propietario", e.target.value)} placeholder="Ej: Juan Pérez o Constructora XYZ" />
            </div>
            <div>
              <Label className="text-xs">Ciudad</Label>
              <Input value={form.ciudad} onChange={(e) => update("ciudad", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Barrio</Label>
              <Input value={form.barrio} onChange={(e) => update("barrio", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Dirección</Label>
              <Input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Estrato</Label>
              <Input type="number" min={1} max={6} value={form.estrato} onChange={(e) => update("estrato", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Select value={form.estado_disponibilidad || "Disponible"} onValueChange={(v) => update("estado_disponibilidad", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Reservado">Reservado</SelectItem>
                  <SelectItem value="Vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.destacado} onCheckedChange={(v) => update("destacado", v)} />
              <Label className="text-xs">Lote destacado</Label>
            </div>
            {isAdminOrAsesor && (
              <div className="flex items-center gap-3">
                <Switch checked={form.es_publico} onCheckedChange={(v) => update("es_publico", v)} />
                <Label className="text-xs">Lote público</Label>
                <span className="font-body text-xs text-muted-foreground">
                  {form.es_publico ? "Visible en el catálogo público" : "Solo visible para el dueño y admins"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Foto del lote */}
        <Card>
          <CardHeader><CardTitle className="text-base">Foto del lote</CardTitle></CardHeader>
          <CardContent>
            {(photoPreview || existingPhotoUrl) ? (
              <div className="relative">
                <img
                  src={photoPreview || existingPhotoUrl!}
                  alt="Foto del lote"
                  className="h-48 w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8"
                  onClick={removePhoto}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted">
                <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">Haz clic para subir una foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ubicación</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Latitud</Label>
                <Input value={form.lat} onChange={(e) => update("lat", e.target.value)} placeholder="6.2530" />
              </div>
              <div>
                <Label className="text-xs">Longitud</Label>
                <Input value={form.lng} onChange={(e) => update("lng", e.target.value)} placeholder="-75.5736" />
              </div>
            </div>
            <GoogleMapsGate
              fallback={<div className="h-56 w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">Cargando mapa…</div>}
            >
              <MemoizedLoteMap
                lat={form.lat}
                lng={form.lng}
                onMapClick={handleMapClick}
                onMarkerDragEnd={handleMarkerDragEnd}
              />
            </GoogleMapsGate>
          </CardContent>
        </Card>

        {/* Dimensiones */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dimensiones</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label className="text-xs">Área m²</Label>
              <Input type="number" value={form.area_total_m2} onChange={(e) => update("area_total_m2", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Frente ml</Label>
              <Input type="number" value={form.frente_ml} onChange={(e) => update("frente_ml", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Fondo ml</Label>
              <Input type="number" value={form.fondo_ml} onChange={(e) => update("fondo_ml", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Matrícula</Label>
              <Input value={form.matricula_inmobiliaria} onChange={(e) => update("matricula_inmobiliaria", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Normativa */}
        <Card>
          <CardHeader><CardTitle className="text-base">Normativa urbana</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <Label className="text-xs">Uso principal</Label>
              <Input value={form.uso_principal} onChange={(e) => update("uso_principal", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Usos compatibles (separados por coma)</Label>
              <Input value={form.usos_compatibles} onChange={(e) => update("usos_compatibles", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Índice construcción</Label>
              <Input type="number" step="0.01" value={form.indice_construccion} onChange={(e) => update("indice_construccion", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Índice ocupación</Label>
              <Input type="number" step="0.01" value={form.indice_ocupacion} onChange={(e) => update("indice_ocupacion", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Altura máx. pisos</Label>
              <Input type="number" value={form.altura_max_pisos} onChange={(e) => update("altura_max_pisos", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Altura máx. metros</Label>
              <Input type="number" value={form.altura_max_metros} onChange={(e) => update("altura_max_metros", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Aisl. frontal m</Label>
              <Input type="number" step="0.1" value={form.aislamiento_frontal_m} onChange={(e) => update("aislamiento_frontal_m", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Aisl. posterior m</Label>
              <Input type="number" step="0.1" value={form.aislamiento_posterior_m} onChange={(e) => update("aislamiento_posterior_m", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Aisl. lateral m</Label>
              <Input type="number" step="0.1" value={form.aislamiento_lateral_m} onChange={(e) => update("aislamiento_lateral_m", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Zona POT</Label>
              <Input value={form.zona_pot} onChange={(e) => update("zona_pot", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Tratamiento</Label>
              <Input value={form.tratamiento} onChange={(e) => update("tratamiento", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Norma vigente</Label>
              <Input value={form.norma_vigente} onChange={(e) => update("norma_vigente", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Cesión tipo A %</Label>
              <Input type="number" step="0.1" value={form.cesion_tipo_a_pct} onChange={(e) => update("cesion_tipo_a_pct", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card>
          <CardHeader><CardTitle className="text-base">Servicios públicos</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 font-semibold">Servicio</th>
                  <th className="pb-2 font-semibold">Estado</th>
                  <th className="pb-2 font-semibold">Operador</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s, i) => (
                  <tr key={s.tipo} className="border-b border-border last:border-0">
                    <td className="py-2 text-foreground">{s.tipo}</td>
                    <td className="py-2">
                      <Select value={s.estado || "Disponible"} onValueChange={(v) => updateServicio(i, "estado", v)}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponible">Disponible</SelectItem>
                          <SelectItem value="En trámite">En trámite</SelectItem>
                          <SelectItem value="No disponible">No disponible</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2">
                      <Input
                        className="h-8"
                        value={s.operador}
                        onChange={(e) => updateServicio(i, "operador", e.target.value)}
                        placeholder="Ej: EPM"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Precio */}
        <Card>
          <CardHeader><CardTitle className="text-base">Precio</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Precio total COP</Label>
              <Input type="number" value={form.precio_cop} onChange={(e) => handlePrecioChange("precio_cop", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Precio por m² COP</Label>
              <Input type="number" value={form.precio_m2_cop} onChange={(e) => handlePrecioChange("precio_m2_cop", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Score de viabilidad */}
        <Card>
          <CardHeader><CardTitle className="text-base">Score de viabilidad</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="text-xs">Score Jurídico</Label>
              <Select value={form.score_juridico || "none"} onValueChange={(v) => update("score_juridico", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem value="1">🟢 Verde — Favorable</SelectItem>
                  <SelectItem value="2">🟡 Amarillo — Requiere revisión</SelectItem>
                  <SelectItem value="3">🔴 Rojo — Tiene observaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Score Normativo</Label>
              <Select value={form.score_normativo || "none"} onValueChange={(v) => update("score_normativo", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem value="1">🟢 Verde — Favorable</SelectItem>
                  <SelectItem value="2">🟡 Amarillo — Requiere revisión</SelectItem>
                  <SelectItem value="3">🔴 Rojo — Tiene observaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Score Servicios</Label>
              <Select value={form.score_servicios || "none"} onValueChange={(v) => update("score_servicios", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem value="1">🟢 Verde — Favorable</SelectItem>
                  <SelectItem value="2">🟡 Amarillo — Requiere revisión</SelectItem>
                  <SelectItem value="3">🔴 Rojo — Tiene observaciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Análisis 360° — Estado por área */}
        {isEdit && isAdminOrAsesor && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Análisis 360° — Estado por área</CardTitle>
                <Link
                  to={`/dashboard/lotes/${id}/analisis`}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Ir al análisis completo
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { key: "normativo", label: "Normativo", icon: FileText },
                  { key: "juridico", label: "Jurídico", icon: Scale },
                  { key: "ambiental", label: "Ambiental", icon: Leaf },
                  { key: "sspp", label: "SSPP", icon: Zap },
                  { key: "geotecnico", label: "Suelos", icon: Mountain },
                  { key: "mercado", label: "Mercado", icon: TrendingUp },
                  { key: "arquitectonico", label: "Arquitectónico", icon: Building2 },
                  { key: "financiero", label: "Financiero", icon: Calculator },
                ].map(({ key, label, icon: Icon }) => {
                  const completado = estadoAnalisis?.[key as keyof typeof estadoAnalisis] ?? false;
                  return (
                    <Link
                      key={key}
                      to={`/dashboard/lotes/${id}/analisis`}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${completado ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{label}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {completado ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={`text-[10px] ${completado ? "text-green-600" : "text-muted-foreground"}`}>
                            {completado ? "Completado" : "Pendiente"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {estadoAnalisis && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Progreso del análisis</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-border">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${(Object.values(estadoAnalisis).filter(Boolean).length / 8) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      {Object.values(estadoAnalisis).filter(Boolean).length}/8
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" variant="default" size="lg" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando…" : "Guardar lote"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate("/dashboard/lotes")}>
            Cancelar
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default LoteFormPage;
