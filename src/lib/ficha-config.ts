export interface SeccionFicha {
  key: string;
  label: string;
  descripcion: string;
  defaultOn: boolean;
}

export const SECCIONES_FICHA: SeccionFicha[] = [
  { key: "fotos",       label: "Fotos del lote",        descripcion: "Galería de imágenes",                 defaultOn: true },
  { key: "ubicacion",   label: "Ubicación y mapa",      descripcion: "Mapa + enlace a Google Maps",         defaultOn: true },
  { key: "area",        label: "Área",                  descripcion: "Metros cuadrados",                    defaultOn: true },
  { key: "uso",         label: "Uso / tipo",            descripcion: "Tipo de lote",                        defaultOn: true },
  { key: "sector",      label: "Ciudad y sector",       descripcion: "Ubicación general",                   defaultOn: true },
  { key: "precio",      label: "Precio",                descripcion: "Precio de venta estimado",            defaultOn: false },
  { key: "propietario", label: "Propietario",           descripcion: "Nombre del propietario",              defaultOn: false },
  { key: "analisis",    label: "Análisis disponibles",  descripcion: "Qué análisis tiene el activo",        defaultOn: true },
  { key: "contacto",    label: "Contacto 360Lateral",   descripcion: "Datos para contactar",                defaultOn: true },
];

export const codificarSecciones = (activas: string[]): string => activas.join(".");

export const decodificarSecciones = (param: string | null): string[] | null => {
  if (!param) return null;
  return param.split(".").filter(Boolean);
};

// UTF-8 safe base64 (handles ñ, acentos)
export const encodeNotaB64 = (txt: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(txt)));
  } catch {
    return "";
  }
};

export const decodeNotaB64 = (param: string | null): string => {
  if (!param) return "";
  try {
    return decodeURIComponent(escape(atob(param)));
  } catch {
    return "";
  }
};
