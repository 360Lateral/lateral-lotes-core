import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmFjdHVyYWNpb250ZXJyYSIsImEiOiJjbW1wY3F3aGcwb2JiMnBweTJ1MnFrMWNxIn0.U5SBL1PDZLqAd4h9RDsx4w";

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

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

  // Mini map
  useEffect(() => {
    if (!mapContainer.current || !lote?.lat || !lote?.lng || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [Number(lote.lng), Number(lote.lat)],
      zoom: 15,
      interactive: false,
    });

    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "#F49D15";
    el.style.border = "2px solid white";
    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";

    new mapboxgl.Marker({ element: el })
      .setLngLat([Number(lote.lng), Number(lote.lat)])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lote?.lat, lote?.lng]);

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
            {/* Gallery / Placeholder */}
            <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-secondary md:h-96">
              <Logo variant="on-navy" className="opacity-40" />
            </div>

            {/* Mini map */}
            {lote.lat && lote.lng && (
              <div
                ref={mapContainer}
                className="h-48 w-full overflow-hidden rounded-lg md:h-64"
              />
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
            <h1 className="font-body text-2xl font-bold text-secondary md:text-3xl">
              {lote.nombre_lote}
            </h1>

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
