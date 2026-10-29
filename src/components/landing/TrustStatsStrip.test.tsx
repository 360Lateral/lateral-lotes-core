import { act, cleanup, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrustStatsStrip from "./TrustStatsStrip";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

let onIntersection: IntersectionObserverCallback;
let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
  rpc.mockResolvedValue({ data: Array.from({ length: 13 }, (_, i) => ({ ciudad: `Municipio ${i % 7}`, publicado_en: null })), error: null });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { onIntersection = callback; }
    observe() {}
    disconnect() {}
  });
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function renderStrip() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><TrustStatsStrip /></QueryClientProvider>);
  return client;
}

describe("Landing market statistics", () => {
  it("uses the market query and calculation: 13 lots and 7 distinct municipalities", async () => {
    const client = renderStrip();
    await waitFor(() => expect(client.getQueryData(["stats-mercado"])).toEqual({ totalLotes: 13, totalMunicipios: 7, totalPublicados7d: 0 }));
    expect(rpc).toHaveBeenCalledWith("listar_mercado_publico");
  });

  it("does not start counting until the strip enters the viewport", async () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const client = renderStrip();
    await waitFor(() => expect(client.getQueryData(["stats-mercado"])).toBeDefined());
    expect(raf).not.toHaveBeenCalled();
    act(() => onIntersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it("returns the final counts immediately without animation under reduced motion", async () => {
    reducedMotion = true;
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const client = renderStrip();
    await waitFor(() => expect(client.getQueryData(["stats-mercado"])).toMatchObject({ totalLotes: 13, totalMunicipios: 7 }));
    act(() => onIntersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(raf).not.toHaveBeenCalled();
  });
});