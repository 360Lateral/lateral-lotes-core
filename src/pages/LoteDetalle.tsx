import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import GoogleMapsGate from "@/components/maps/GoogleMapsGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ScoreIndicator from "@/components/ScoreIndicator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Logo from "@/components/ui/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  X,
  FileText,
  Download,
  Lock,
  Pencil,
} from "lucide-react";
import AsistenteChat from "@/components/AsistenteChat";
import { useToast } from "@/hooks/use-toast";



const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

const estadoVariant = (e: string) => {
  switch (e) {
    case "Disponible":
      return "disponible" as const;
    case "Reservado":
      return "reservado" as const;
    case "Vendido":
      return "vendido" as const;
    default:
      return "default" as const;
  }
};

const servicioIcon = (estado: string) => {
  switch (estado) {
    case "Disponible":
      return <Check className="h-4 w-4" />;
    case "En trámite":
      return <Clock className="h-4 w-4" />;
    case "No disponible":
      return <X className="h-4 w-4" />;
    default:
      return null;
  }
};

const servicioVariant = (estado: string) => {
  switch (estado) {
    case "Disponible":
      return "disponible" as const;
    case "En trámite":
      return "reservado" as const;
    case "No disponible":
      return "vendido" as const;
    default:
      return "default" as const;
  }
};

const categoriasDoc = [
  { key: "financiero", label: "Financiero" },
  { key: "tecnico", label: "Técnico" },
  { key: "predial", label: "Predial" },
  { key: "normativo", label: "Normativo" },
  { key: "juridico", label: "Jurídico" },
  { key: "otro", label: "Otro" },
];

const LoteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isDeveloper, isAdminOrAsesor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [creatingNeg, setCreatingNeg] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { data: mapsKey } = useGoogleMapsKey();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: mapsKey ?? "", id: "google-map-script" });

  // Form state
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formMensaje, setFormMensaje] = useState("");

  // Fetch lote
  const { data: lote, isLoading: loadingLote } = useQuery({
    queryKey: ["lote-detalle", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch fotos
  const { data: fotos = [] } = useQuery({
    queryKey: ["lote-fotos", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("fotos_lotes")
        .select("url, orden")
        .eq("lote_id", id!)
        .order("orden", { ascending: true });
      return data ?? [];
    },
    enabled: !!id,
  });

  // Fetch precio
  const { data: precio } = useQuery({
    queryKey: ["lote-precio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("precios")
        .select("*")
        .eq("lote_id", id!)
        .order("vigencia", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch precio referencia zona
  const { data: precioRef } = useQuery({
    queryKey: ["precio-ref", lote?.ciudad],
    enabled: !!lote?.ciudad,
    queryFn: async () => {
      const { data } = await supabase
        .from("precios")
        .select("precio_m2_cop, lotes!inner(ciudad)")
        .eq("lotes.ciudad", lote!.ciudad!)
        .not("lote_id", "eq", id);
      if (!data || data.length === 0) return null;
      const avg = data.reduce((s, r) => s + Number(r.precio_m2_cop), 0) / data.length;
      return Math.round(avg);
    },
  });

  // Fetch normativa
  const { data: normativa } = useQuery({
    queryKey: ["lote-normativa", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("normativa_urbana")
        .select("*")
        .eq("lote_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch servicios
  const { data: servicios = [] } = useQuery({
    queryKey: ["lote-servicios", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios_publicos")
        .select("*")
        .eq("lote_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch documentos (only if authenticated)
  const { data: documentos = [] } = useQuery({
    queryKey: ["lote-docs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analisis_documentos")
        .select("*")
        .eq("lote_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Lead mutation
  const leadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert({
        nombre: formNombre.trim(),
        email: formEmail.trim(),
        telefono: formTelefono.trim() || null,
        mensaje: formMensaje.trim() || null,
        lote_id: id!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "¡Consulta enviada!",
        description:
          "Un asesor de 360Lateral se pondrá en contacto contigo pronto.",
      });
      setContactOpen(false);
      setFormNombre("");
      setFormEmail("");
      setFormTelefono("");
      setFormMensaje("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No pudimos enviar tu consulta. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Mini map is now rendered declaratively via GoogleMap component

  const handleDownload = async (storagePath: string | null, fileName: string) => {
    if (!storagePath) return;
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: "No se pudo generar el enlace de descarga.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const isVendido = lote?.estado_disponibilidad === "Vendido";

  if (loadingLote) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="grid gap-8 lg:grid-cols-5">
            <Skeleton className="h-96 lg:col-span-3" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="font-body text-muted-foreground">Lote no encontrado.</p>
        </div>
      </div>
    );
  }

  // Protect private lots: if not public and user is not owner or admin
  const isPrivate = (lote as any).es_publico === false;
  const isOwner = user && (lote as any).owner_id === user.id;
  if (isPrivate && !isOwner && !isAdminOrAsesor) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="font-body text-lg font-semibold text-foreground">Este lote no está disponible</p>
          <p className="font-body text-sm text-muted-foreground">El lote es privado o está en revisión.</p>
          <Button variant="default" asChild>
            <Link to="/lotes">Ver lotes disponibles</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <Link
          to="/lotes"
          className="mb-6 inline-flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a lotes
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT COLUMN (60%) */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* Gallery */}
            <div className="relative flex flex-col gap-2">
              <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-secondary md:h-96">
                {fotos.length > 0 ? (
                  <>
                    <img src={fotos[galleryIndex]?.url} alt={`${lote.nombre_lote} - foto ${galleryIndex + 1}`} className="h-full w-full object-cover" />
                    {fotos.length > 1 && (
                      <>
                        <button
                          onClick={() => setGalleryIndex((prev) => (prev - 1 + fotos.length) % fotos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow hover:bg-background"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setGalleryIndex((prev) => (prev + 1) % fotos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground shadow hover:bg-background"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (lote as any).foto_url ? (
                  <img src={(lote as any).foto_url} alt={lote.nombre_lote} className="h-full w-full object-cover" />
                ) : (
                  <Logo variant="on-navy" className="opacity-40" />
                )}
              </div>
              {/* Thumbnails */}
              {fotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {fotos.slice(0, 5).map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                        i === galleryIndex ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={f.url} alt={`Miniatura ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            {(lote as any).video_url && (
              <div>
                {(lote as any).video_url.includes("youtube") || (lote as any).video_url.includes("youtu.be") ? (
                  <iframe
                    src={(lote as any).video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                    className="w-full rounded-lg h-48 md:h-64"
                    allowFullScreen
                    title="Video del lote"
                  />
                ) : (
                  <video
                    src={(lote as any).video_url}
                    controls
                    className="w-full rounded-lg max-h-64"
                  />
                )}
              </div>
            )}

            {/* Mini map */}
            {lote.lat && lote.lng && isLoaded && mapsKey && (
              <div className="h-48 w-full overflow-hidden rounded-lg md:h-64">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{ lat: Number(lote.lat), lng: Number(lote.lng) }}
                  zoom={15}
                  options={{ mapTypeId: "hybrid" as google.maps.MapTypeId, disableDefaultUI: true, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
                >
                  <MarkerF
                    position={{ lat: Number(lote.lat), lng: Number(lote.lng) }}
                    icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: "#F49D15", fillOpacity: 1, strokeColor: "#FFFFFF", strokeWeight: 2, scale: 8 }}
                  />
                </GoogleMap>
              </div>
            )}

            {/* Notes */}
            {lote.notas && (
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-2 font-body text-sm font-semibold text-foreground">
                  Descripción
                </h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">
                  {lote.notas}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (40%) */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="flex items-center gap-3">
              <h1 className="font-body text-2xl font-bold text-secondary md:text-3xl">
                {lote.nombre_lote}
              </h1>
              {isAdminOrAsesor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/lotes/${id}/editar`)}
                  className="shrink-0"
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Editar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-body text-sm text-muted-foreground">
                {lote.barrio}
                {lote.ciudad ? `, ${lote.ciudad}` : ""}
              </span>
            </div>

            <Badge variant={estadoVariant(lote.estado_disponibilidad)}>
              {lote.estado_disponibilidad}
            </Badge>

            {/* Vendido banner */}
            {isVendido && (
              <div className="rounded-lg bg-destructive px-4 py-3 text-center font-body text-sm font-semibold text-destructive-foreground">
                Este lote ya fue vendido
              </div>
            )}

            {/* Pricing */}
            {!isVendido && precio && (
              <div>
                {precio.precio_cop != null && (
                  <p className="font-body text-2xl font-bold text-secondary">
                    {formatCOP(Number(precio.precio_cop))}
                  </p>
                )}
                 {precio.precio_m2_cop != null && (
                  <p className="font-body text-sm text-muted-foreground">
                    {formatCOP(Number(precio.precio_m2_cop))}/m²
                  </p>
                )}
                {precioRef && (
                  <p className="font-body text-xs text-muted-foreground">
                    Promedio zona: {formatCOP(precioRef)}/m²
                  </p>
                )}
              </div>
            )}

            {/* Contact button */}
            {!isVendido && (
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={creatingNeg}
                onClick={async () => {
                  if (isDeveloper && user) {
                    setCreatingNeg(true);
                    try {
                      // Check existing negociacion
                      const { data: existing } = await supabase
                        .from("negociaciones")
                        .select("id")
                        .eq("lote_id", id!)
                        .eq("developer_id", user.id)
                        .in("estado", ["activa", "en_revision"] as any)
                        .limit(1)
                        .maybeSingle();
                      if (existing) {
                        navigate(`/negociacion/${existing.id}`);
                      } else {
                        const { data: nuevo, error } = await supabase
                          .from("negociaciones")
                          .insert({ lote_id: id!, developer_id: user.id } as any)
                          .select("id")
                          .single();
                        if (error) throw error;
                        navigate(`/negociacion/${nuevo.id}`);
                      }
                    } catch {
                      toast({ title: "Error", description: "No se pudo iniciar la negociación.", variant: "destructive" });
                    } finally {
                      setCreatingNeg(false);
                    }
                  } else {
                    setContactOpen(true);
                  }
                }}
              >
                {creatingNeg ? "Iniciando..." : "Me interesa este lote"}
              </Button>
            )}

            {/* Basic data card */}
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 p-4">
                <DataItem
                  label="Área total"
                  value={
                    lote.area_total_m2
                      ? `${Number(lote.area_total_m2).toLocaleString("es-CO")} m²`
                      : "—"
                  }
                />
                <DataItem
                  label="Frente × Fondo"
                  value={
                    lote.frente_ml && lote.fondo_ml
                      ? `${Number(lote.frente_ml)} × ${Number(lote.fondo_ml)} ml`
                      : "—"
                  }
                />
                <DataItem
                  label="Matrícula"
                  value={lote.matricula_inmobiliaria ?? "—"}
                />
                <DataItem
                  label="Estrato"
                  value={lote.estrato != null ? String(lote.estrato) : "—"}
                />
                <DataItem
                  label="Coordenadas"
                  value={
                    lote.lat && lote.lng
                      ? `${Number(lote.lat).toFixed(4)}, ${Number(lote.lng).toFixed(4)}`
                      : "—"
                  }
                />
              </CardContent>
            </Card>

            {/* Score de viabilidad */}
            <div className="flex items-start gap-6 rounded-lg border border-border p-4">
              <ScoreIndicator score={lote.score_juridico} label="Jurídico" emoji="⚖️" size="lg" />
              <ScoreIndicator score={lote.score_normativo} label="Normativo" emoji="📋" size="lg" />
              <ScoreIndicator score={lote.score_servicios} label="Servicios" emoji="🔌" size="lg" />
            </div>

            {/* Asistente IA 360° */}
            <AsistenteChat
              loteId={id!}
              loteContext={{
                nombre_lote: lote.nombre_lote,
                ciudad: lote.ciudad,
                departamento: lote.departamento,
                area_total_m2: lote.area_total_m2 ? Number(lote.area_total_m2) : null,
                uso_principal: normativa?.uso_principal ?? null,
                indice_construccion: normativa?.indice_construccion ? Number(normativa.indice_construccion) : null,
                indice_ocupacion: normativa?.indice_ocupacion ? Number(normativa.indice_ocupacion) : null,
                altura_max_pisos: normativa?.altura_max_pisos ?? null,
                altura_max_metros: normativa?.altura_max_metros ? Number(normativa.altura_max_metros) : null,
                zona_pot: normativa?.zona_pot ?? null,
                tratamiento: normativa?.tratamiento ?? null,
                norma_vigente: normativa?.norma_vigente ?? null,
                score_juridico: lote.score_juridico,
                score_normativo: lote.score_normativo,
                score_servicios: lote.score_servicios,
                notas: lote.notas,
              }}
            />

            {/* Tabs */}
            <Tabs defaultValue="normativa" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="normativa" className="flex-1 font-body text-xs">
                  Normativa
                </TabsTrigger>
                <TabsTrigger value="servicios" className="flex-1 font-body text-xs">
                  Servicios
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex-1 font-body text-xs">
                  Documentos
                </TabsTrigger>
                <TabsTrigger value="resolutoria" className="flex-1 font-body text-xs">
                  Resolutoría
                </TabsTrigger>
              </TabsList>

              {/* Tab: Normativa */}
              <TabsContent value="normativa">
                {normativa ? (
                  <div className="flex flex-col gap-4">
                    {normativa.uso_principal && (
                      <div>
                        <Badge variant="default" className="text-sm px-3 py-1">
                          {normativa.uso_principal}
                        </Badge>
                      </div>
                    )}

                    {normativa.usos_compatibles &&
                      normativa.usos_compatibles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {normativa.usos_compatibles.map((u) => (
                            <Badge key={u} variant="secondary" className="text-xs">
                              {u}
                            </Badge>
                          ))}
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-3">
                      <DataItem
                        label="Índice construcción"
                        value={
                          normativa.indice_construccion != null
                            ? String(normativa.indice_construccion)
                            : "—"
                        }
                      />
                      <DataItem
                        label="Índice ocupación"
                        value={
                          normativa.indice_ocupacion != null
                            ? String(normativa.indice_ocupacion)
                            : "—"
                        }
                      />
                      <DataItem
                        label="Altura máx. pisos"
                        value={
                          normativa.altura_max_pisos != null
                            ? String(normativa.altura_max_pisos)
                            : "—"
                        }
                      />
                      <DataItem
                        label="Altura máx. metros"
                        value={
                          normativa.altura_max_metros != null
                            ? `${normativa.altura_max_metros} m`
                            : "—"
                        }
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <DataItem
                        label="Aisl. frontal"
                        value={
                          normativa.aislamiento_frontal_m != null
                            ? `${normativa.aislamiento_frontal_m} m`
                            : "—"
                        }
                      />
                      <DataItem
                        label="Aisl. posterior"
                        value={
                          normativa.aislamiento_posterior_m != null
                            ? `${normativa.aislamiento_posterior_m} m`
                            : "—"
                        }
                      />
                      <DataItem
                        label="Aisl. lateral"
                        value={
                          normativa.aislamiento_lateral_m != null
                            ? `${normativa.aislamiento_lateral_m} m`
                            : "—"
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <DataItem
                        label="Zona POT"
                        value={normativa.zona_pot ?? "—"}
                      />
                      <DataItem
                        label="Tratamiento"
                        value={normativa.tratamiento ?? "—"}
                      />
                      <DataItem
                        label="Norma vigente"
                        value={normativa.norma_vigente ?? "—"}
                      />
                      {normativa.cesion_tipo_a_pct != null && (
                        <DataItem
                          label="Cesión tipo A"
                          value={`${normativa.cesion_tipo_a_pct}%`}
                        />
                      )}
                    </div>

                    {/* Alertas automáticas */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {normativa.indice_construccion != null && Number(normativa.indice_construccion) >= 2.5 && (
                        <Badge variant="disponible" className="text-xs">IC alto — potencial de densificación</Badge>
                      )}
                      {normativa.indice_construccion != null && Number(normativa.indice_construccion) < 1.5 && (
                        <Badge variant="vendido" className="text-xs">IC bajo — construcción limitada</Badge>
                      )}
                      {normativa.altura_max_pisos != null && normativa.altura_max_pisos >= 8 && (
                        <Badge variant="disponible" className="text-xs">Alta densidad permitida</Badge>
                      )}
                      {normativa.cesion_tipo_a_pct != null && Number(normativa.cesion_tipo_a_pct) >= 25 && (
                        <Badge variant="reservado" className="text-xs">Cesión alta — revisar área útil resultante</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="py-6 text-center font-body text-sm text-muted-foreground">
                    No hay datos de normativa para este lote.
                  </p>
                )}
              </TabsContent>

              {/* Tab: Servicios */}
              <TabsContent value="servicios">
                {servicios.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-2 font-semibold text-foreground">
                            Servicio
                          </th>
                          <th className="pb-2 font-semibold text-foreground">
                            Estado
                          </th>
                          <th className="pb-2 font-semibold text-foreground">
                            Operador
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicios.map((s) => (
                          <tr
                            key={s.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="py-2 text-foreground">{s.tipo}</td>
                            <td className="py-2">
                              <Badge
                                variant={servicioVariant(s.estado)}
                                className="gap-1"
                              >
                                {servicioIcon(s.estado)}
                                {s.estado}
                              </Badge>
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {s.operador ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-6 text-center font-body text-sm text-muted-foreground">
                    No hay datos de servicios para este lote.
                  </p>
                )}
              </TabsContent>

              {/* Tab: Documentos */}
              <TabsContent value="documentos">
                {!user ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                      <p className="font-body text-sm text-muted-foreground">
                        Inicia sesión para acceder a los análisis técnicos,
                        financieros y prediales de este lote.
                      </p>
                      <Button variant="default" size="sm" asChild>
                        <Link to="/login">Iniciar sesión</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : documentos.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {categoriasDoc.map((cat) => {
                      const docs = documentos.filter(
                        (d) => d.categoria === cat.key
                      );
                      if (docs.length === 0) return null;
                      return (
                        <div key={cat.key}>
                          <h4 className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {cat.label}
                          </h4>
                          <div className="flex flex-col gap-2">
                            {docs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                                  <div className="min-w-0">
                                    <p className="truncate font-body text-sm font-medium text-foreground">
                                      {doc.nombre}
                                    </p>
                                    <p className="font-body text-xs text-muted-foreground">
                                      {new Date(doc.created_at).toLocaleDateString("es-CO")}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDownload(doc.url_storage, doc.nombre)
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center font-body text-sm text-muted-foreground">
                    No hay documentos para este lote.
                  </p>
                )}
              </TabsContent>

              {/* Tab: Resolutoría */}
              <TabsContent value="resolutoria">
                {(lote as any).has_resolutoria === true ? (
                  <div className="flex flex-col gap-4">
                    <Badge variant="disponible" className="w-fit gap-1 text-sm px-3 py-1">
                      <Check className="h-4 w-4" /> Resolutoría 360° Completada
                    </Badge>
                    <div className="grid grid-cols-2 gap-2">
                      {["Normativo", "Jurídico", "SSPP", "Suelos", "Mercado", "Ambiental", "Arquitectónico", "Financiero"].map((area) => (
                        <div key={area} className="flex items-center gap-2 font-body text-sm text-foreground">
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                          {area}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" asChild className="w-fit">
                      <Link to="/planes">Ver Teaser Financiero</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="font-body text-sm font-semibold text-foreground">
                      Este lote aún no tiene Resolutoría 360°
                    </p>
                    <p className="font-body text-xs text-muted-foreground max-w-sm">
                      Análisis de 8 áreas que transforma tu lote en un activo comercializable con Teaser Financiero.
                    </p>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
                      <Link to={`/diagnostico?lote_id=${id}`}>Solicitar Resolutoría</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />

      {/* Contact Modal */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-body text-secondary">
              Me interesa este lote
            </DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Déjanos tus datos y un asesor te contactará pronto.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!formNombre.trim() || !formEmail.trim()) return;
              leadMutation.mutate();
            }}
          >
            <div>
              <Label className="font-body text-xs">Nombre completo *</Label>
              <Input
                required
                maxLength={100}
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <div>
              <Label className="font-body text-xs">Email *</Label>
              <Input
                type="email"
                required
                maxLength={255}
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="font-body text-xs">Teléfono</Label>
              <Input
                type="tel"
                maxLength={20}
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
              />
            </div>
            <div>
              <Label className="font-body text-xs">Mensaje</Label>
              <Textarea
                maxLength={1000}
                rows={3}
                value={formMensaje}
                onChange={(e) => setFormMensaje(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="default"
              className="w-full"
              disabled={leadMutation.isPending}
            >
              {leadMutation.isPending ? "Enviando…" : "Enviar consulta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DataItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-body text-xs text-muted-foreground">{label}</p>
    <p className="font-body text-sm font-semibold text-foreground">{value}</p>
  </div>
);

export default LoteDetalle;
