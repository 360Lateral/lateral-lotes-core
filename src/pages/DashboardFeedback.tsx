import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, Table as TableIcon, Search, Loader2 } from "lucide-react";
import { useFeedbackAdmin } from "@/hooks/feedback/useFeedbackAdmin";
import EmptyState from "@/components/ui/EmptyState";
import KanbanFeedback from "@/components/feedback/KanbanFeedback";
import FeedbackDetalle from "@/components/feedback/FeedbackDetalle";
import {
  ESTADO_LABEL,
  ESTADO_TONO,
  SEVERIDAD_LABEL,
  SEVERIDAD_TONO,
  TIPO_LABEL,
  type EstadoFeedback,
  type SeveridadFeedback,
  type TipoFeedback,
} from "@/lib/feedback-transitions";
import { formatRelativeDate } from "@/lib/formatRelativeDate";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

const DashboardFeedback = () => {
  const { data: tickets = [], isLoading } = useFeedbackAdmin();
  const [vista, setVista] = useState<"kanban" | "tabla">("kanban");
  const [q, setQ] = useState("");
  const [tipoF, setTipoF] = useState<string>("all");
  const [sevF, setSevF] = useState<string>("all");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const txt = q.trim().toLowerCase();
    return tickets.filter((t: any) => {
      if (tipoF !== "all" && t.tipo !== tipoF) return false;
      if (sevF !== "all" && t.severidad !== sevF) return false;
      if (
        txt &&
        !(`${t.titulo} ${t.descripcion} ${t.autor?.nombre ?? ""}`)
          .toLowerCase()
          .includes(txt)
      )
        return false;
      return true;
    });
  }, [tickets, q, tipoF, sevF]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const nuevos = tickets.filter((t: any) => t.estado === "nuevo").length;
    const abiertos = tickets.filter(
      (t: any) =>
        !["resuelto", "descartado", "duplicado"].includes(t.estado),
    ).length;
    const resueltos = tickets.filter((t: any) => t.estado === "resuelto").length;
    return { total, nuevos, abiertos, resueltos };
  }, [tickets]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Feedback de usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} tickets · {stats.nuevos} nuevos · {stats.abiertos} abiertos · {stats.resueltos} resueltos
          </p>
        </div>

        <Card>
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, descripción o autor..."
                className="pl-7 h-9"
              />
            </div>
            <Select value={tipoF} onValueChange={setTipoF}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {(Object.keys(TIPO_LABEL) as TipoFeedback[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sevF} onValueChange={setSevF}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(Object.keys(SEVERIDAD_LABEL) as SeveridadFeedback[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERIDAD_LABEL[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border">
              <Button
                size="sm"
                variant={vista === "kanban" ? "default" : "ghost"}
                onClick={() => setVista("kanban")}
                className="h-9 rounded-r-none"
              >
                <LayoutGrid className="h-3 w-3 mr-1" /> Kanban
              </Button>
              <Button
                size="sm"
                variant={vista === "tabla" ? "default" : "ghost"}
                onClick={() => setVista("tabla")}
                className="h-9 rounded-l-none"
              >
                <TableIcon className="h-3 w-3 mr-1" /> Tabla
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            titulo="Sin feedback por ahora"
            descripcion="Cuando los usuarios envíen tickets aparecerán aquí."
          />
        ) : vista === "kanban" ? (
          <KanbanFeedback tickets={filtrados} onOpen={setDetalleId} />
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Título</th>
                    <th className="text-left px-3 py-2">Tipo</th>
                    <th className="text-left px-3 py-2">Severidad</th>
                    <th className="text-left px-3 py-2">Estado</th>
                    <th className="text-left px-3 py-2">Autor</th>
                    <th className="text-left px-3 py-2">Asignado</th>
                    <th className="text-left px-3 py-2">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((t: any) => (
                    <tr
                      key={t.id}
                      className="border-t hover:bg-muted/30 cursor-pointer"
                      onClick={() => setDetalleId(t.id)}
                    >
                      <td className="px-3 py-2 font-medium max-w-[280px] truncate">
                        {t.titulo}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {TIPO_LABEL[t.tipo as TipoFeedback]}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className={cn(
                            "border-0 text-[10px]",
                            SEVERIDAD_TONO[t.severidad as SeveridadFeedback],
                          )}
                        >
                          {SEVERIDAD_LABEL[t.severidad as SeveridadFeedback]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className={cn(
                            "border-0 text-[10px]",
                            ESTADO_TONO[t.estado as EstadoFeedback],
                          )}
                        >
                          {ESTADO_LABEL[t.estado as EstadoFeedback]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {t.autor?.nombre ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {t.asignado?.nombre ?? (
                          <span className="text-muted-foreground italic">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatRelativeDate(t.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      <FeedbackDetalle
        ticketId={detalleId}
        onClose={() => setDetalleId(null)}
        modoAdmin
      />
    </DashboardLayout>
  );
};

export default DashboardFeedback;
