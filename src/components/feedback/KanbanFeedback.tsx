import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { GripVertical, User } from "lucide-react";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { cn } from "@/lib/utils";
import { useActualizarEstadoFeedback } from "@/hooks/feedback/useActualizarEstadoFeedback";
import {
  ESTADO_LABEL,
  SEVERIDAD_TONO,
  TIPO_LABEL,
  esTransicionValida,
  motivoTransicionInvalida,
  requiereConfirmacion,
  type EstadoFeedback,
  type SeveridadFeedback,
} from "@/lib/feedback-transitions";

interface Props {
  tickets: any[];
  onOpen: (id: string) => void;
}

const COLUMNAS: { key: EstadoFeedback; label: string; color: string }[] = [
  { key: "nuevo", label: "Nuevo", color: "bg-primary/10" },
  { key: "en_revision", label: "En revisión", color: "bg-amber-500/10" },
  { key: "planificado", label: "Planificado", color: "bg-blue-500/10" },
  { key: "en_progreso", label: "En progreso", color: "bg-violet-500/10" },
  { key: "resuelto", label: "Resuelto", color: "bg-success/10" },
  { key: "descartado", label: "Descartado", color: "bg-muted/40" },
];
const COL_KEYS = new Set<string>(COLUMNAS.map((c) => c.key));

const KanbanCard = ({
  ticket,
  onOpen,
}: {
  ticket: any;
  onOpen: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ticket.id, data: { ticket } });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-md border border-border bg-background p-2 pl-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1.5 flex h-5 w-4 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label="Arrastrar"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onOpen(ticket.id)}
        className="w-full text-left"
      >
        <div className="mb-1 flex items-center gap-1">
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            {TIPO_LABEL[ticket.tipo as keyof typeof TIPO_LABEL]}
          </Badge>
          <Badge
            className={cn(
              "h-4 px-1 text-[9px] border-0",
              SEVERIDAD_TONO[ticket.severidad as SeveridadFeedback],
            )}
          >
            {ticket.severidad}
          </Badge>
        </div>
        <p className="text-xs font-semibold text-foreground line-clamp-2">
          {ticket.titulo}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
          <User className="h-3 w-3 shrink-0" />
          {ticket.autor?.nombre ?? "—"}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatRelativeDate(ticket.created_at)}
          {ticket.asignado?.nombre && (
            <> · → {ticket.asignado.nombre}</>
          )}
        </p>
      </button>
    </div>
  );
};

const KanbanColumna = ({
  col,
  items,
  isDropTarget,
  isValid,
  onOpen,
}: {
  col: (typeof COLUMNAS)[number];
  items: any[];
  isDropTarget: boolean;
  isValid: boolean | null;
  onOpen: (id: string) => void;
}) => {
  const { setNodeRef } = useDroppable({
    id: col.key,
    data: { columnKey: col.key },
  });
  const highlight =
    isDropTarget && isValid === true
      ? "ring-2 ring-primary"
      : isDropTarget && isValid === false
      ? "ring-2 ring-destructive"
      : "";
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
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
            Sin tickets
          </div>
        ) : (
          items.map((t) => (
            <KanbanCard key={t.id} ticket={t} onOpen={onOpen} />
          ))
        )}
      </div>
    </div>
  );
};

export const KanbanFeedback = ({ tickets, onOpen }: Props) => {
  const actualizar = useActualizarEstadoFeedback();
  const [active, setActive] = useState<any | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const porColumna = useMemo(() => {
    const m: Record<string, any[]> = {};
    COLUMNAS.forEach((c) => (m[c.key] = []));
    tickets.forEach((t) => {
      if (m[t.estado] !== undefined) m[t.estado].push(t);
    });
    return m;
  }, [tickets]);

  const isValid: boolean | null = useMemo(() => {
    if (!active || !overId || !COL_KEYS.has(overId)) return null;
    return esTransicionValida(
      active.estado as EstadoFeedback,
      overId as EstadoFeedback,
    );
  }, [active, overId]);

  const handleEnd = (event: DragEndEvent) => {
    const target = (event.over?.id as string | undefined) ?? null;
    const t = tickets.find((x) => x.id === event.active.id);
    setActive(null);
    setOverId(null);
    if (!t || !target || !COL_KEYS.has(target)) return;
    const desde = t.estado as EstadoFeedback;
    const hacia = target as EstadoFeedback;
    if (desde === hacia) return;
    if (!esTransicionValida(desde, hacia)) {
      toast.error("Transición no permitida", {
        description: motivoTransicionInvalida(desde, hacia),
      });
      return;
    }
    if (requiereConfirmacion(hacia)) {
      // Para descartado/duplicado/resuelto abrimos el detalle para capturar metadata
      onOpen(t.id);
      toast.info(`Abre el detalle para marcar como ${ESTADO_LABEL[hacia]}.`);
      return;
    }
    actualizar.mutate({ ticketId: t.id, estado: hacia });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => {
        setActive(tickets.find((t) => t.id === e.active.id) ?? null);
      }}
      onDragOver={(e: DragOverEvent) =>
        setOverId((e.over?.id as string | undefined) ?? null)
      }
      onDragEnd={handleEnd}
      onDragCancel={() => {
        setActive(null);
        setOverId(null);
      }}
    >
      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-2">
          {COLUMNAS.map((c) => (
            <KanbanColumna
              key={c.key}
              col={c}
              items={porColumna[c.key] ?? []}
              isDropTarget={overId === c.key}
              isValid={overId === c.key ? isValid : null}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="w-[260px] rounded-md border border-border bg-background p-2 shadow-lg">
            <p className="text-xs font-semibold truncate">{active.titulo}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanFeedback;
