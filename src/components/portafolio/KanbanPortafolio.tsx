import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import type { PortafolioVistaFila } from "@/hooks/useVistaPortafolio";
import {
  ESTADO_LABEL,
  esTransicionValida,
  motivoTransicionInvalida,
  requiereConfirmacion,
  type EstadoEngagement,
} from "@/lib/engagement-transitions";
import { useActualizarEstadoEngagement } from "@/hooks/useActualizarEstadoEngagement";
import { useAuth } from "@/contexts/AuthContext";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAsesoresList } from "@/hooks/useAsesoresList";
import { useAsignarAsesorEngagement } from "@/hooks/useAsignarAsesorEngagement";
import {
  MapPin,
  User,
  GripVertical,
  Check,
} from "lucide-react";
import { urgenciaClass, ajusteSinAsesor } from "@/lib/sla-helpers";
import { BadgeSla } from "./BadgeSla";

interface Props {
  filas: PortafolioVistaFila[];
  mostrarCerrados?: boolean;
}

const COLUMNAS: { key: EstadoEngagement; label: string; color: string }[] = [
  { key: "prospecto", label: "Prospecto", color: "bg-muted/40" },
  { key: "activo", label: "Activo", color: "bg-primary/10" },
  { key: "en_revision", label: "En revisión", color: "bg-primary/15" },
  { key: "entregado", label: "Entregado", color: "bg-success/15" },
  { key: "cerrado", label: "Cerrado", color: "bg-muted/30" },
  { key: "cancelado", label: "Cancelado", color: "bg-destructive/10" },
];

const COLUMNAS_KEYS = new Set<string>(COLUMNAS.map((c) => c.key));

const urgenciaCardClass = (f: PortafolioVistaFila): string =>
  `${urgenciaClass(f)} ${ajusteSinAsesor(f)}`.trim();

// ============ Card draggable ============
const KanbanCard = ({
  fila,
  onOpen,
  isAdmin,
}: {
  fila: PortafolioVistaFila;
  onOpen: (id: string) => void;
  isAdmin: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: fila.engagement_id,
      data: { fila },
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };


  const { data: asesores = [] } = useAsesoresList();
  const asignar = useAsignarAsesorEngagement();
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-md border border-border bg-background p-2 pl-6 shadow-sm transition-shadow hover:shadow-md ${urgenciaCardClass(fila)}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1.5 flex h-5 w-4 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`Arrastrar ${fila.lote_nombre ?? "engagement"}`}
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onOpen(fila.engagement_id)}
        className="w-full text-left"
      >
        <p className="text-xs font-semibold text-foreground truncate">
          {fila.lote_nombre ?? "Lote sin nombre"}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          {[fila.lote_ciudad, fila.lote_barrio].filter(Boolean).join(" · ") ||
            "—"}
        </p>
      </button>

      {/* Asesor — admin: editable Popover; otros: texto */}
      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <User className="h-3 w-3 shrink-0" />
        {isAdmin ? (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="rounded px-1 py-0.5 text-[10px] hover:bg-muted/60 truncate max-w-[170px] text-left"
              >
                {fila.asesor_nombre ?? (
                  <span className="italic">Asignar asesor</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-0"
              align="start"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Command>
                <CommandInput placeholder="Buscar asesor..." className="h-8" />
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {asesores.map((a) => (
                      <CommandItem
                        key={a.id}
                        value={a.nombre}
                        onSelect={() => {
                          if (a.id !== fila.asesor_id) {
                            asignar.mutate({
                              engagementId: fila.engagement_id,
                              nuevoAsesorId: a.id,
                              nuevoAsesorNombre: a.nombre,
                            });
                          }
                          setPopoverOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={`mr-2 h-3 w-3 ${fila.asesor_id === a.id ? "opacity-100" : "opacity-0"}`}
                        />
                        {a.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="truncate">
            {fila.asesor_nombre ?? <span className="italic">Sin asesor</span>}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(fila.engagement_id)}
        className="w-full text-left"
      >
        {fila.avance_pct != null && (
          <div className="mt-2 space-y-1">
            <Progress value={Number(fila.avance_pct)} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {Math.round(Number(fila.avance_pct))}% avance
            </p>
          </div>
        )}
        {fila.sla_estado && (
          <div className="mt-1.5">
            <BadgeSla
              estado={fila.sla_estado}
              diasParaSla={fila.dias_para_sla}
              size="xs"
            />
          </div>
        )}
      </button>
    </div>
  );
};

// ============ Columna droppable ============
const KanbanColumna = ({
  col,
  items,
  isDropTarget,
  isValidTarget,
  onOpen,
  isAdmin,
  mostrarCerrados,
}: {
  col: (typeof COLUMNAS)[number];
  items: PortafolioVistaFila[];
  isDropTarget: boolean;
  isValidTarget: boolean | null;
  onOpen: (id: string) => void;
  isAdmin: boolean;
  mostrarCerrados: boolean;
}) => {
  const { setNodeRef } = useDroppable({
    id: col.key,
    data: { columnKey: col.key },
  });

  const highlight =
    isDropTarget && isValidTarget === true
      ? "ring-2 ring-primary"
      : isDropTarget && isValidTarget === false
        ? "ring-2 ring-destructive"
        : "";

  const esTerminal = col.key === "cerrado" || col.key === "cancelado";
  const ocultarCards = esTerminal && !mostrarCerrados;

  return (
    <div
      ref={setNodeRef}
      className={`w-[280px] shrink-0 rounded-md ${col.color} p-2 transition-shadow ${highlight}`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {col.label}
        </span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {ocultarCards ? 0 : items.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
        {ocultarCards ? (
          <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
            Ocultos. Activa "Mostrar cerrados" para ver.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
            Sin engagements
          </div>
        ) : (
          items.map((f) => (
            <KanbanCard
              key={f.engagement_id}
              fila={f}
              onOpen={onOpen}
              isAdmin={isAdmin}
            />
          ))
        )}
        {!ocultarCards && items.length > 50 && (
          <p className="text-[10px] text-warning px-1">
            {items.length} items — considera filtrar
          </p>
        )}
      </div>
    </div>
  );
};

// ============ Principal ============
export const KanbanPortafolio = ({ filas, mostrarCerrados = true }: Props) => {
  const navigate = useNavigate();
  const { user, roles, isSuperAdmin, isAdminOrExperto } = useAuth();
  const isAdmin =
    isSuperAdmin || (roles ?? []).some((r) => r === "admin" || r === "super_admin");
  const actualizar = useActualizarEstadoEngagement();

  const [activeFila, setActiveFila] = useState<PortafolioVistaFila | null>(
    null,
  );
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [confirmTransition, setConfirmTransition] = useState<{
    fila: PortafolioVistaFila;
    nuevoEstado: EstadoEngagement;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const puedeModificar = (fila: PortafolioVistaFila): boolean => {
    if (isSuperAdmin || isAdminOrExperto) return true;
    return fila.asesor_id === user?.id;
  };

  const porColumna = useMemo(() => {
    const map: Record<string, PortafolioVistaFila[]> = {};
    COLUMNAS.forEach((c) => (map[c.key] = []));
    filas.forEach((f) => {
      if (map[f.estado] !== undefined) map[f.estado].push(f);
    });
    return map;
  }, [filas]);

  const handleDragStart = (event: DragStartEvent) => {
    const fila = filas.find((f) => f.engagement_id === event.active.id);
    if (fila) setActiveFila(fila);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = (event.over?.id as string | undefined) ?? null;
    setDragOverColId(overId);
  };

  const dropTargetIsValid: boolean | null = useMemo(() => {
    if (!activeFila || !dragOverColId) return null;
    if (!COLUMNAS_KEYS.has(dragOverColId)) return null;
    return esTransicionValida(
      activeFila.estado as EstadoEngagement,
      dragOverColId as EstadoEngagement,
    );
  }, [activeFila, dragOverColId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const targetCol = (event.over?.id as string | undefined) ?? null;
    const fila = filas.find((f) => f.engagement_id === event.active.id);
    setActiveFila(null);
    setDragOverColId(null);

    if (!fila || !targetCol || !COLUMNAS_KEYS.has(targetCol)) return;
    const nuevoEstado = targetCol as EstadoEngagement;
    const desde = fila.estado as EstadoEngagement;

    if (desde === nuevoEstado) return;

    if (!puedeModificar(fila)) {
      toast.error("Sin permisos", {
        description:
          "Solo el asesor del engagement o un admin pueden cambiarlo de estado.",
      });
      return;
    }

    if (!esTransicionValida(desde, nuevoEstado)) {
      toast.error("Transición no permitida", {
        description: motivoTransicionInvalida(desde, nuevoEstado),
      });
      return;
    }

    if (requiereConfirmacion(nuevoEstado)) {
      setConfirmTransition({ fila, nuevoEstado });
      return;
    }

    aplicarCambio(fila, nuevoEstado);
  };

  const aplicarCambio = (
    fila: PortafolioVistaFila,
    nuevoEstado: EstadoEngagement,
  ) => {
    actualizar.mutate({
      engagementId: fila.engagement_id,
      nuevoEstado,
      estadoAnterior: fila.estado as EstadoEngagement,
    });
  };

  const handleOpen = (id: string) => {
    navigate(`/dashboard/engagements/${id}`);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveFila(null);
          setDragOverColId(null);
        }}
      >
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-2">
            {COLUMNAS.map((col) => (
              <KanbanColumna
                key={col.key}
                col={col}
                items={porColumna[col.key] ?? []}
                isDropTarget={dragOverColId === col.key}
                isValidTarget={
                  dragOverColId === col.key ? dropTargetIsValid : null
                }
                onOpen={handleOpen}
                isAdmin={isAdmin}
                mostrarCerrados={mostrarCerrados}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeFila ? (
            <div className="w-[260px] rounded-md border border-border bg-background p-2 shadow-lg">
              <p className="text-xs font-semibold text-foreground truncate">
                {activeFila.lote_nombre ?? "—"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground truncate">
                {activeFila.lote_ciudad ?? "—"}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog
        open={!!confirmTransition}
        onOpenChange={(open) => {
          if (!open) setConfirmTransition(null);
        }}
      >
        <AlertDialogContent>
          {confirmTransition && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmTransition.nuevoEstado === "cancelado" &&
                    "¿Cancelar este engagement?"}
                  {confirmTransition.nuevoEstado === "entregado" &&
                    "¿Marcar como entregado?"}
                  {confirmTransition.nuevoEstado === "cerrado" &&
                    "¿Cerrar definitivamente?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Estás a punto de mover "
                  {confirmTransition.fila.lote_nombre ?? "engagement"}" de "
                  {ESTADO_LABEL[
                    confirmTransition.fila.estado as EstadoEngagement
                  ] ?? confirmTransition.fila.estado}
                  " a "{ESTADO_LABEL[confirmTransition.nuevoEstado]}".
                  {confirmTransition.nuevoEstado === "cancelado" &&
                    " Esta acción no se puede revertir desde Kanban."}
                  {confirmTransition.nuevoEstado === "cerrado" &&
                    " Un engagement cerrado no puede modificarse más."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    aplicarCambio(
                      confirmTransition.fila,
                      confirmTransition.nuevoEstado,
                    );
                    setConfirmTransition(null);
                  }}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KanbanPortafolio;
