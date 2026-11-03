import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, FileText, AlertTriangle, ChevronRight } from "lucide-react";
import CriticidadBadge from "./CriticidadBadge";
import {
  FILTROS_VACIOS, NO_DISPONIBLE, filtrarDiagnosticos, formatoFecha,
  type VidDiagnostico, type VidFiltros,
} from "@/lib/vid-diagnosticos";

export function useVidDiagnosticos() {
  return useQuery({
    queryKey: ["vid-diagnosticos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vid_diagnosticos").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as VidDiagnostico[];
    },
  });
}

const TODOS = "__todos";

export default function VidPortafolio({ basePath, esEquipo }: { basePath: string; esEquipo: boolean }) {
  const { data, isLoading, error } = useVidDiagnosticos();
  const [f, setF] = useState<VidFiltros>(FILTROS_VACIOS);
  const lista = data ?? [];
  const ciudades = useMemo(() => [...new Set(lista.map((d) => d.ciudad).filter(Boolean))].sort() as string[], [lista]);
  const tipos = useMemo(() => [...new Set(lista.map((d) => d.tipo_inmueble).filter(Boolean))].sort() as string[], [lista]);
  const filtrados = filtrarDiagnosticos(lista, f);
  const set = (k: keyof VidFiltros) => (v: string) => setF((p) => ({ ...p, [k]: v === TODOS ? "" : v }));

  const conteo = { alto: 0, medio: 0, bajo: 0 };
  lista.forEach((d) => d.criticidad && conteo[d.criticidad]++);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Activos", lista.length],
          ["Criticidad alta", conteo.alto],
          ["Criticidad media", conteo.medio],
          ["Criticidad baja", conteo.bajo],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-2xl font-semibold mt-1">{v as number}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={f.texto}
            onChange={(e) => set("texto")(e.target.value)}
            placeholder="Buscar por código, nombre, ciudad o dirección"
            className="pl-9 h-11"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={f.ciudad || TODOS} onValueChange={set("ciudad")}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Ciudad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas las ciudades</SelectItem>
              {ciudades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={f.tipo || TODOS} onValueChange={set("tipo")}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Tipo de inmueble" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los tipos</SelectItem>
              {tipos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={f.criticidad || TODOS} onValueChange={set("criticidad")}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Criticidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Toda criticidad</SelectItem>
              <SelectItem value="alto">Alta</SelectItem>
              <SelectItem value="medio">Media</SelectItem>
              <SelectItem value="bajo">Baja</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={f.desde} onChange={(e) => set("desde")(e.target.value)} className="h-11" aria-label="Diagnóstico desde" />
            <Button variant="outline" className="h-11 shrink-0" onClick={() => setF(FILTROS_VACIOS)}>Limpiar</Button>
          </div>
        </div>
      </Card>

      {isLoading && <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}</div>}
      {error && <Card className="p-6 text-destructive">No pudimos cargar los diagnósticos: {(error as Error).message}</Card>}
      {!isLoading && !error && filtrados.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          {lista.length === 0 ? "Aún no hay diagnósticos disponibles." : "Ningún activo coincide con los filtros."}
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtrados.map((d) => (
          <Link key={d.id} to={`${basePath}/${d.codigo_activo}`} className="group">
            <Card className="p-4 h-full transition-shadow group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block rounded bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5">{d.codigo_activo}</span>
                  <h3 className="font-semibold mt-2 leading-snug">{d.nombre_activo}</h3>
                </div>
                <CriticidadBadge nivel={d.criticidad} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{d.ciudad ?? NO_DISPONIBLE} · {d.tipo_inmueble ?? NO_DISPONIBLE}</p>
                <p className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 shrink-0" />Diagnóstico: {formatoFecha(d.fecha_diagnostico)}</p>
              </div>
              {d.resumen && <p className="text-sm mt-3 line-clamp-2">{d.resumen}</p>}
              <div className="mt-3 flex items-center justify-between text-xs">
                {esEquipo && (d.requiere_revision || !d.generado_at) ? (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {d.requiere_revision ? "Requiere revisión" : "Diagnóstico sin generar"}
                  </span>
                ) : <span className="text-muted-foreground">{esEquipo ? `${d.documentos_procesados} documentos leídos` : ""}</span>}
                <span className="flex items-center text-primary font-medium">Ver ficha <ChevronRight className="h-4 w-4" /></span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
