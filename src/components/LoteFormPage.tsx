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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, FileText, Scale, Leaf, Zap, Mountain, TrendingUp, Building2, Calculator, CheckCircle2, Clock, ExternalLink, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";




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
  // Precio
  precio_cop: string;
  precio_m2_cop: string;
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
  precio_cop: "",
  precio_m2_cop: "",
  es_publico: true,
};


const LoteFormPage = ({ isEdit = false }: { isEdit?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminOrAsesor } = useAuth();

  const [form, setForm] = useState<LoteForm>(emptyForm);
  
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
      const normativa = await supabase.from("normativa_urbana").select("id").eq("lote_id", id!).maybeSingle();
      return {
        normativo: !!normativa.data,
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
        matricula_inmobiliaria: form.matricula_inmobiliaria || null,
        notas: form.notas || null,
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
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Área m²</Label>
              <Input type="number" value={form.area_total_m2} onChange={(e) => update("area_total_m2", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Matrícula</Label>
              <Input value={form.matricula_inmobiliaria} onChange={(e) => update("matricula_inmobiliaria", e.target.value)} />
            </div>
          </CardContent>
        </Card>


        {/* Precio */}
        <Card>
          <CardHeader><CardTitle className="text-base">Precio del propietario</CardTitle></CardHeader>
          <CardContent className="!pt-0">
            <p className="text-xs text-muted-foreground -mt-2 mb-2">
              Precio solicitado por el propietario. El valor real del lote se determina en el Análisis Financiero 360°.
            </p>
          </CardContent>
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
