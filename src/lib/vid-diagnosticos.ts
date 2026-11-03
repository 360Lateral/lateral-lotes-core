export type Criticidad = "alto" | "medio" | "bajo";

export interface VidHallazgo {
  titulo: string;
  descripcion: string;
  criticidad: Criticidad;
  area: string | null;
}

export interface VidPaso {
  prioridad: number;
  paso: string;
  plazo: string | null;
  area: string | null;
}

export interface VidDatos {
  direccion_inmueble?: string | null;
  area_lote_m2?: number | null;
  area_construida_m2?: number | null;
  matricula_inmobiliaria?: string | null;
  uso_actual?: string | null;
  estado_fisico?: string | null;
  adicionales?: { campo: string; valor: string }[];
}

export interface VidDiagnostico {
  id: string;
  codigo_activo: string;
  nombre_activo: string;
  lote_id: string | null;
  drive_folder_id: string;
  ciudad: string | null;
  tipo_inmueble: string | null;
  fecha_diagnostico: string | null;
  criticidad: Criticidad | null;
  datos: VidDatos;
  resumen: string | null;
  hallazgos: VidHallazgo[];
  plan_accion: VidPaso[];
  requiere_revision: boolean;
  motivo_revision: string | null;
  documentos_procesados: number;
  generado_at: string | null;
}

export const NO_DISPONIBLE = "No disponible";

export const CRITICIDAD_LABEL: Record<Criticidad, string> = { alto: "Alta", medio: "Media", bajo: "Baja" };
export const CRITICIDAD_ORDEN: Record<Criticidad, number> = { alto: 0, medio: 1, bajo: 2 };

export const driveFolderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;

/** Ordena códigos E1..E9, A1..A5, CB8..CB10 de forma natural. */
export function compararCodigo(a: string, b: string) {
  const pa = a.match(/^([A-Z]+)(\d+)$/), pb = b.match(/^([A-Z]+)(\d+)$/);
  if (!pa || !pb) return a.localeCompare(b);
  const orden = ["E", "A", "CB"];
  const d = orden.indexOf(pa[1]) - orden.indexOf(pb[1]);
  return d !== 0 ? d : Number(pa[2]) - Number(pb[2]);
}

export interface VidFiltros {
  texto: string;
  ciudad: string;
  tipo: string;
  criticidad: string;
  desde: string;
}

export const FILTROS_VACIOS: VidFiltros = { texto: "", ciudad: "", tipo: "", criticidad: "", desde: "" };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function filtrarDiagnosticos(lista: VidDiagnostico[], f: VidFiltros) {
  const t = norm(f.texto.trim());
  return lista
    .filter((d) => {
      if (t) {
        const hay = norm([d.codigo_activo, d.nombre_activo, d.ciudad ?? "", d.tipo_inmueble ?? "", d.datos?.direccion_inmueble ?? ""].join(" "));
        if (!hay.includes(t)) return false;
      }
      if (f.ciudad && d.ciudad !== f.ciudad) return false;
      if (f.tipo && d.tipo_inmueble !== f.tipo) return false;
      if (f.criticidad && d.criticidad !== f.criticidad) return false;
      if (f.desde && (!d.fecha_diagnostico || d.fecha_diagnostico < f.desde)) return false;
      return true;
    })
    .sort((a, b) => compararCodigo(a.codigo_activo, b.codigo_activo));
}

export const formatoFecha = (iso: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }) : NO_DISPONIBLE;
