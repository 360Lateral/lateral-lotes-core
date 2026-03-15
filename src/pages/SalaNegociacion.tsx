import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, MessageSquare, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const estadoBadgeClass = (e: string) => {
  switch (e) {
    case "activa": return "disponible" as const;
    case "en_revision": return "reservado" as const;
    case "cerrada": return "vendido" as const;
    case "concretada": return "disponible" as const;
    default: return "default" as const;
  }
};

const estadoLabel = (e: string) => {
  switch (e) {
    case "activa": return "Activa";
    case "en_revision": return "En revisión";
    case "cerrada": return "Cerrada";
    case "concretada": return "Concretada";
    default: return e;
  }
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const SalaNegociacion = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdminOrAsesor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mensaje, setMensaje] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("");

  // Fetch negociacion with lote and precio
  const { data: negociacion, isLoading } = useQuery({
    queryKey: ["negociacion", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negociaciones")
        .select("*, lotes(nombre_lote, area_total_m2, ciudad)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: precio } = useQuery({
    queryKey: ["neg-precio", negociacion?.lote_id],
    enabled: !!negociacion?.lote_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("precios")
        .select("precio_cop, precio_m2_cop")
        .eq("lote_id", negociacion!.lote_id)
        .order("vigencia", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch mensajes
  const { data: mensajes = [] } = useQuery({
    queryKey: ["mensajes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("negociacion_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch participant profiles
  const { data: perfiles = [] } = useQuery({
    queryKey: ["neg-perfiles", negociacion?.developer_id, negociacion?.owner_id],
    enabled: !!negociacion,
    queryFn: async () => {
      const ids = [negociacion!.developer_id, negociacion!.owner_id].filter(Boolean);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("perfiles").select("*").in("id", ids);
      return data ?? [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`mensajes-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes", filter: `negociacion_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["mensajes", id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mensajes").insert({
        negociacion_id: id!,
        sender_id: user!.id,
        contenido: mensaje.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMensaje("");
      queryClient.invalidateQueries({ queryKey: ["mensajes", id] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo enviar el mensaje.", variant: "destructive" });
    },
  });

  // Update negociacion status
  const updateEstado = useMutation({
    mutationFn: async (estado: string) => {
      const { error } = await supabase
        .from("negociaciones")
        .update({ estado } as any)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacion", id] });
      toast({ title: "Estado actualizado" });
    },
  });

  // Toggle contacto_visible
  const toggleContacto = useMutation({
    mutationFn: async (val: boolean) => {
      const { error } = await supabase
        .from("negociaciones")
        .update({ contacto_visible: val } as any)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacion", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <p className="font-body text-muted-foreground">Cargando sala...</p>
      </div>
    );
  }

  if (!negociacion) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <p className="font-body text-muted-foreground">Negociación no encontrada.</p>
      </div>
    );
  }

  const loteData = negociacion.lotes as any;
  const isParticipant = user?.id === negociacion.developer_id || user?.id === negociacion.owner_id;
  const canChat = isParticipant || isAdminOrAsesor;
  const isClosed = negociacion.estado === "cerrada" || negociacion.estado === "concretada";

  const getPerfilName = (uid: string | null) => {
    if (!uid) return "Sin asignar";
    const p = perfiles.find((p: any) => p.id === uid);
    return p?.nombre ?? "Usuario";
  };

  const otherUserId = user?.id === negociacion.developer_id ? negociacion.owner_id : negociacion.developer_id;
  const otherPerfil = perfiles.find((p: any) => p.id === otherUserId);

  const ChatPanel = () => (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">
            No hay mensajes aún. ¡Inicia la conversación!
          </p>
        )}
        {mensajes.map((m: any) => {
          const isOwn = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 font-body text-sm ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-accent text-foreground rounded-bl-md"
                }`}
              >
                <p>{m.contenido}</p>
                <p className={`mt-1 text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canChat && !isClosed && (
        <div className="border-t border-border bg-background p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (mensaje.trim()) sendMutation.mutate();
            }}
          >
            <Input
              placeholder="Escribe un mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="flex-1 font-body"
            />
            <Button type="submit" disabled={!mensaje.trim() || sendMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
      {isClosed && (
        <div className="border-t border-border bg-muted p-3 text-center font-body text-xs text-muted-foreground">
          Esta negociación está {negociacion.estado === "cerrada" ? "cerrada" : "concretada"}.
        </div>
      )}
    </div>
  );

  const InfoPanel = () => (
    <div className="flex flex-col gap-4 p-4">
      {/* Status */}
      <div>
        <p className="font-body text-xs font-semibold text-muted-foreground mb-1">Estado</p>
        <Badge variant={estadoBadgeClass(negociacion.estado)}>{estadoLabel(negociacion.estado)}</Badge>
      </div>

      {/* Admin controls */}
      {isAdminOrAsesor && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <p className="font-body text-xs font-semibold text-foreground">Controles Admin</p>
            <div className="space-y-1.5">
              <Label className="font-body text-xs text-muted-foreground">Cambiar estado</Label>
              <div className="flex gap-2">
                <Select value={nuevoEstado || negociacion.estado} onValueChange={setNuevoEstado}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="en_revision">En revisión</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                    <SelectItem value="concretada">Concretada</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!nuevoEstado || nuevoEstado === negociacion.estado}
                  onClick={() => updateEstado.mutate(nuevoEstado)}
                >
                  Guardar
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-body text-xs text-muted-foreground">Contacto visible</Label>
              <Switch
                checked={negociacion.contacto_visible}
                onCheckedChange={(val) => toggleContacto.mutate(val)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <div>
        <p className="font-body text-xs font-semibold text-muted-foreground mb-2">Participantes</p>
        <div className="space-y-2 font-body text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Developer</p>
            <p className="text-foreground">{getPerfilName(negociacion.developer_id)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Propietario</p>
            <p className="text-foreground">{getPerfilName(negociacion.owner_id)}</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      {negociacion.contacto_visible && otherPerfil && (
        <Card>
          <CardContent className="p-4">
            <p className="font-body text-xs font-semibold text-foreground mb-2">Datos de contacto</p>
            <div className="space-y-1 font-body text-sm">
              <p className="text-foreground">{otherPerfil.nombre}</p>
              {otherPerfil.telefono && (
                <p className="text-muted-foreground">{otherPerfil.telefono}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" size="sm" asChild>
        <Link to={`/lotes/${negociacion.lote_id}`}>Ver lote</Link>
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-muted">
      {/* Header */}
      <header className="shrink-0 bg-secondary px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-secondary-foreground/80 hover:text-secondary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-body text-sm font-bold text-secondary-foreground">
              {loteData?.nombre_lote ?? "Lote"}
            </h1>
            <p className="font-body text-xs text-secondary-foreground/70">
              {loteData?.area_total_m2 ? `${Number(loteData.area_total_m2).toLocaleString("es-CO")} m²` : ""}
              {loteData?.ciudad ? ` · ${loteData.ciudad}` : ""}
              {precio?.precio_cop ? ` · ${formatCOP(Number(precio.precio_cop))}` : ""}
            </p>
          </div>
          <Badge variant={estadoBadgeClass(negociacion.estado)} className="shrink-0">
            {estadoLabel(negociacion.estado)}
          </Badge>
        </div>
      </header>

      {/* Body */}
      {isMobile ? (
        <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="shrink-0 w-full rounded-none border-b border-border">
            <TabsTrigger value="chat" className="flex-1 font-body text-xs gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1 font-body text-xs gap-1">
              <Info className="h-3.5 w-3.5" /> Info
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="info" className="flex-1 overflow-y-auto mt-0">
            <InfoPanel />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col border-r border-border bg-background">
            <ChatPanel />
          </div>
          <div className="w-72 shrink-0 overflow-y-auto bg-background">
            <InfoPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaNegociacion;
