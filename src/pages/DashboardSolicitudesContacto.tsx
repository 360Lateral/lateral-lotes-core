import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, Navigate } from "react-router-dom";
import { Mail, Phone, User, MapPin, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSolicitudesContacto,
  type EstadoSolicitud,
} from "@/hooks/useSolicitudesContacto";
import { useActualizarSolicitudContacto } from "@/hooks/useActualizarSolicitudContacto";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const codigoAnonimo = (id: string) =>
  `LOTE-${id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;

const fmtFecha = (s: string | null) =>
  s ? new Date(s).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "—";

interface PropietarioInfo {
  nombre: string | null;
  email: string | null;
  telefono: string | null;
}

const PropietarioBlock = ({ propietarioId }: { propietarioId: string | null }) => {
  const { data } = useQuery({
    queryKey: ["propietario-info", propietarioId],
    enabled: !!propietarioId,
    queryFn: async (): Promise<PropietarioInfo | null> => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("nombre, email, telefono")
        .eq("id", propietarioId!)
        .maybeSingle();
      if (error) throw error;
      return (data as PropietarioInfo | null) ?? null;
    },
  });

  if (!propietarioId) {
    return <p className="text-sm text-muted-foreground">Lote sin propietario asignado.</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Cargando datos del propietario…</p>;
  }
  return (
    <div className="space-y-1 text-sm">
      <p className="flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        {data.nombre ?? "—"}
      </p>
      <p className="flex items-center gap-2">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        {data.email ?? "—"}
      </p>
      <p className="flex items-center gap-2">
        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
        {data.telefono ?? "—"}
      </p>
    </div>
  );
};

type Solicitud = ReturnType<typeof useSolicitudesContacto>["data"] extends
  | (infer T)[]
  | undefined
  ? T
  : never;

const SolicitudCard = ({
  s,
  isAdminFull,
  onMarcar,
  onCerrar,
}: {
  s: any;
  isAdminFull: boolean;
  onMarcar: (s: any) => void;
  onCerrar: (s: any) => void;
}) => {
  const lote = s.lote;
  const dev = s.desarrollador;
  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono font-semibold text-secondary">
            {lote ? codigoAnonimo(lote.id) : "—"}
          </p>
          <p className="text-sm font-medium">{lote?.nombre_lote ?? "(sin nombre)"}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {[lote?.ciudad, lote?.barrio].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-xs text-muted-foreground">
            {s.estado === "pendiente"
              ? `Solicitado: ${fmtFecha(s.created_at)}`
              : `Procesado: ${fmtFecha(s.fecha_procesado)}`}
          </p>
          {lote?.id && (
            <Link
              to={`/dashboard/lotes/${lote.id}/analisis`}
              className="text-xs text-primary hover:underline"
            >
              Ver lote →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Desarrollador
          </p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {dev?.nombre ?? "—"}
              {dev?.nivel_suscripcion && (
                <Badge variant="outline" className="text-[10px]">
                  {dev.nivel_suscripcion}
                </Badge>
              )}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {dev?.email ?? "—"}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {dev?.telefono ?? "—"}
            </p>
          </div>
        </div>

        {isAdminFull && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Propietario del lote
            </p>
            <PropietarioBlock propietarioId={lote?.propietario_id ?? null} />
          </div>
        )}
      </div>

      <div className="pt-2 border-t">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
          <FileText className="h-3 w-3" /> Mensaje
        </p>
        <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-md p-3">{s.mensaje}</p>
      </div>

      {s.notas_admin && (
        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Notas internas
          </p>
          <p className="text-sm whitespace-pre-wrap bg-success/5 rounded-md p-3 border border-success/20">
            {s.notas_admin}
          </p>
          {s.procesador?.nombre && (
            <p className="text-xs text-muted-foreground mt-1">Por {s.procesador.nombre}</p>
          )}
        </div>
      )}

      {s.estado === "pendiente" && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button size="sm" onClick={() => onMarcar(s)}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como contactado
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCerrar(s)}>
            <XCircle className="h-4 w-4 mr-1" /> Cerrar solicitud
          </Button>
        </div>
      )}
    </Card>
  );
};

const ListaSolicitudes = ({
  estado,
  isAdminFull,
  onMarcar,
  onCerrar,
}: {
  estado: EstadoSolicitud;
  isAdminFull: boolean;
  onMarcar: (s: any) => void;
  onCerrar: (s: any) => void;
}) => {
  const { data = [], isLoading } = useSolicitudesContacto(estado);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        No hay solicitudes en este estado.
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {data.map((s: any) => (
        <SolicitudCard
          key={s.id}
          s={s}
          isAdminFull={isAdminFull}
          onMarcar={onMarcar}
          onCerrar={onCerrar}
        />
      ))}
    </div>
  );
};

const DashboardSolicitudesContacto = () => {
  const { roles, loading } = useAuth();
  const isAdmin = roles.some((r) => ["super_admin", "admin"].includes(r));
  const isExperto = roles.includes("experto" as any);
  const autorizado = isAdmin || isExperto;
  // Only admin/super_admin see owner contact info
  const isAdminFull = isAdmin;

  const { data: pendientes = [] } = useSolicitudesContacto("pendiente");

  const [marcarOpen, setMarcarOpen] = useState(false);
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [target, setTarget] = useState<any>(null);
  const [notas, setNotas] = useState("");
  const { mutate, isPending } = useActualizarSolicitudContacto();

  if (!loading && !autorizado) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleMarcarClick = (s: any) => {
    setTarget(s);
    setNotas("");
    setMarcarOpen(true);
  };
  const handleCerrarClick = (s: any) => {
    setTarget(s);
    setNotas("");
    setCerrarOpen(true);
  };

  const confirmarMarcar = () => {
    if (!target) return;
    mutate(
      { id: target.id, estado: "contactado", notas_admin: notas.trim() || undefined },
      { onSuccess: () => setMarcarOpen(false) },
    );
  };
  const confirmarCerrar = () => {
    if (!target) return;
    mutate(
      { id: target.id, estado: "cerrado", notas_admin: notas.trim() || undefined },
      { onSuccess: () => setCerrarOpen(false) },
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Solicitudes de contacto</h1>
          <p className="text-sm text-muted-foreground">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""} por procesar.
          </p>
        </div>

        <Tabs defaultValue="pendiente">
          <TabsList>
            <TabsTrigger value="pendiente">
              Pendientes
              {pendientes.length > 0 && (
                <Badge variant="default" className="ml-2 text-[10px]">
                  {pendientes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contactado">Atendidas</TabsTrigger>
            <TabsTrigger value="cerrado">Cerradas</TabsTrigger>
          </TabsList>
          <TabsContent value="pendiente" className="mt-4">
            <ListaSolicitudes
              estado="pendiente"
              isAdminFull={isAdminFull}
              onMarcar={handleMarcarClick}
              onCerrar={handleCerrarClick}
            />
          </TabsContent>
          <TabsContent value="contactado" className="mt-4">
            <ListaSolicitudes
              estado="contactado"
              isAdminFull={isAdminFull}
              onMarcar={handleMarcarClick}
              onCerrar={handleCerrarClick}
            />
          </TabsContent>
          <TabsContent value="cerrado" className="mt-4">
            <ListaSolicitudes
              estado="cerrado"
              isAdminFull={isAdminFull}
              onMarcar={handleMarcarClick}
              onCerrar={handleCerrarClick}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog marcar como contactado */}
      <Dialog open={marcarOpen} onOpenChange={setMarcarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar solicitud como contactado</DialogTitle>
            <DialogDescription>
              Agrega notas opcionales sobre cómo contactaste y qué acordaste con el propietario.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Llamé al propietario, agendamos reunión el martes…"
            rows={5}
            maxLength={1000}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcarOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={confirmarMarcar} disabled={isPending}>
              {isPending ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog cerrar */}
      <AlertDialog open={cerrarOpen} onOpenChange={setCerrarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sin contactar?</AlertDialogTitle>
            <AlertDialogDescription>
              La solicitud se marcará como cerrada y el desarrollador podrá volver a solicitar
              contacto si lo desea. Puedes agregar notas opcionales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Motivo del cierre (opcional)"
            rows={4}
            maxLength={1000}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCerrar} disabled={isPending}>
              {isPending ? "Cerrando..." : "Cerrar solicitud"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardSolicitudesContacto;
