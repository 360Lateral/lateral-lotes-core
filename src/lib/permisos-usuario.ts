export const PERMISOS_USUARIO = [
  { id: "ver_portafolio", label: "Ver portafolio" },
  { id: "ver_diagnosticos", label: "Ver diagnósticos" },
  { id: "publicar_activo", label: "Publicar activos" },
  { id: "contratar_diagnostico", label: "Contratar diagnósticos" },
  { id: "subir_documentos", label: "Subir documentos" },
  { id: "escribir_asesor", label: "Escribir al asesor" },
  { id: "gestionar_comisionistas", label: "Gestionar comisionistas" },
  { id: "sala_negociacion", label: "Acceder a salas de negociación" },
] as const;

export type PermisoUsuario = typeof PERMISOS_USUARIO[number]["id"];
export type EstadoPermisos = Record<PermisoUsuario, boolean>;

export function plantillaSoloLectura(): EstadoPermisos {
  return Object.fromEntries(PERMISOS_USUARIO.map(({ id }) => [id,
    id === "ver_portafolio" || id === "ver_diagnosticos",
  ])) as EstadoPermisos;
}

export function estadoPermisos(rows: { permiso: string; habilitado: boolean }[]): EstadoPermisos {
  return Object.fromEntries(PERMISOS_USUARIO.map(({ id }) => [id,
    rows.find((row) => row.permiso === id)?.habilitado ?? true,
  ])) as EstadoPermisos;
}