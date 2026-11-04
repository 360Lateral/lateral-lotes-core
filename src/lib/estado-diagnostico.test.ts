import { describe, it, expect } from "vitest";
import { estadoDiagnostico } from "./estado-diagnostico";

describe("estadoDiagnostico", () => {
  it("prospecto y activo se muestran como Pendiente", () => {
    expect(estadoDiagnostico("prospecto")?.label).toBe("Pendiente");
    expect(estadoDiagnostico("activo")?.label).toBe("Pendiente");
  });
  it("en_revision se muestra como En revisión", () => {
    expect(estadoDiagnostico("en_revision")?.label).toBe("En revisión");
  });
  it("entregado y cerrado se muestran como Finalizado", () => {
    expect(estadoDiagnostico("entregado")?.label).toBe("Finalizado");
    expect(estadoDiagnostico("cerrado")?.label).toBe("Finalizado");
  });
  it("cancelado o sin estado no muestra etiqueta", () => {
    expect(estadoDiagnostico("cancelado")).toBeNull();
    expect(estadoDiagnostico(null)).toBeNull();
  });
});
