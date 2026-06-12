export const formatCOP = (n: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatCOPCompact = (n: number): string => {
  if (!n && n !== 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$ ${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$ ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$ ${Math.round(n / 1_000)}K`;
  return `$ ${n.toLocaleString("es-CO")}`;
};

export const formatoRelativo = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day} ${day === 1 ? "día" : "días"}`;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatFecha = (s?: string | null): string =>
  s
    ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
