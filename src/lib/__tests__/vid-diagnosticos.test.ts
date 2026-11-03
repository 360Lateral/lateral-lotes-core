import { describe, it, expect } from "vitest";
import { compararCodigo, filtrarDiagnosticos, FILTROS_VACIOS, type VidDiagnostico } from "../vid-diagnosticos";

const d = (codigo: string, extra: Partial<VidDiagnostico> = {}) =>
  ({ id: codigo, codigo_activo: codigo, nombre_activo: codigo, ciudad: "Medellín", tipo_inmueble: "Casa", criticidad: "medio", fecha_diagnostico: "2026-05-01", datos: {}, ...extra }) as VidDiagnostico;

describe("diagnósticos VID", () => {
  it("ordena E antes de A y CB, con números naturales", () => {
    expect(["CB10", "A1", "E9", "CB8", "E1"].sort(compararCodigo)).toEqual(["E1", "E9", "A1", "CB8", "CB10"]);
  });
  it("filtra por criticidad", () => {
    const r = filtrarDiagnosticos([d("E1", { criticidad: "alto" }), d("E2")], { ...FILTROS_VACIOS, criticidad: "alto" });
    expect(r.map((x) => x.codigo_activo)).toEqual(["E1"]);
  });
  it("busca sin tildes", () => {
    const r = filtrarDiagnosticos([d("A1", { nombre_activo: "Lote Municipio de Apartadó" }), d("E2")], { ...FILTROS_VACIOS, texto: "apartado" });
    expect(r.map((x) => x.codigo_activo)).toEqual(["A1"]);
  });
  it("el filtro de fecha excluye diagnósticos sin fecha", () => {
    const r = filtrarDiagnosticos([d("E1", { fecha_diagnostico: null }), d("E2")], { ...FILTROS_VACIOS, desde: "2026-01-01" });
    expect(r.map((x) => x.codigo_activo)).toEqual(["E2"]);
  });
});
