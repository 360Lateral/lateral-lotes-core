import { describe, expect, it } from "vitest";
import { estadoPermisos, plantillaSoloLectura } from "./permisos-usuario";

describe("Permisos por usuario", () => {
  it("Solo lectura mantiene únicamente ver_portafolio y ver_diagnosticos", () => {
    expect(plantillaSoloLectura()).toEqual({
      ver_portafolio: true,
      ver_diagnosticos: true,
      publicar_activo: false,
      contratar_diagnostico: false,
      subir_documentos: false,
      escribir_asesor: false,
      gestionar_comisionistas: false,
      sala_negociacion: false,
    });
  });

  it("Respeta permisos apagados y el valor efectivo del servidor para permisos sin fila", () => {
    const result = estadoPermisos([{ permiso: "publicar_activo", habilitado: false }]);
    expect(result.publicar_activo).toBe(false);
    expect(result.ver_portafolio).toBe(true);
  });
});