export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `hace ${sec} ${sec === 1 ? "segundo" : "segundos"}`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} ${min === 1 ? "minuto" : "minutos"}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} ${hr === 1 ? "hora" : "horas"}`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day} ${day === 1 ? "día" : "días"}`;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
