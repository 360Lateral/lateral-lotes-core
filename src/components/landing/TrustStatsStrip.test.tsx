import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrustStatsStrip from "./TrustStatsStrip";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

let onIntersection: IntersectionObserverCallback;
let reducedMotion = false;
let root: Root;
let container: HTMLDivElement;

async function waitForData(client: QueryClient) {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  expect(client.getQueryData(["stats-mercado"])).toBeDefined();
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  reducedMotion = false;
  rpc.mockResolvedValue({ data: Array.from({ length: 13 }, (_, i) => ({ ciudad: `Municipio ${i % 7}`, publicado_en: null })), error: null });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { onIntersection = callback; }
    observe() {}
    disconnect() {}
  });
});

afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function renderStrip() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => root.render(<QueryClientProvider client={client}><TrustStatsStrip /></QueryClientProvider>));
  return client;
}

describe("Landing market statistics", () => {
  it("uses the market query and calculation: 13 lots and 7 distinct municipalities", async () => {
    const client = renderStrip();
    await waitForData(client);
    expect(client.getQueryData(["stats-mercado"])).toEqual({ totalLotes: 13, totalMunicipios: 7, totalPublicados7d: 0 });
    expect(rpc).toHaveBeenCalledWith("listar_mercado_publico");
  });

  it("does not start counting until the strip enters the viewport", async () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    const client = renderStrip();
    await waitForData(client);
    expect(raf).not.toHaveBeenCalled();
    act(() => onIntersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(raf).toHaveBeenCalledTimes(1);
  });

  it("returns the final counts immediately without animation under reduced motion", async () => {
    reducedMotion = true;
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const client = renderStrip();
    await waitForData(client);
    expect(Array.from(container.querySelectorAll(".tabular-nums"), (element) => Number(element.textContent))).toEqual([13, 7]);
    act(() => onIntersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(raf).not.toHaveBeenCalled();
  });
});