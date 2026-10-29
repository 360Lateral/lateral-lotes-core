import { useEffect, useRef, useState } from "react";
import { Award, Building2, FileCheck, MapPin } from "lucide-react";
import { useStatsMercado } from "@/hooks/useStatsMercado";

export default function TrustStatsStrip() {
  const { data: stats } = useStatsMercado();
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [counts, setCounts] = useState([0, 0]);
  const lotes = stats?.totalLotes;
  const municipios = stats?.totalMunicipios;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reducedMotion || lotes === undefined || municipios === undefined) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCounts([Math.round(lotes * eased), Math.round(municipios * eased)]);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reducedMotion, lotes, municipios]);

  const items = [
    { icon: MapPin, label: "Lotes disponibles", value: lotes === undefined ? "—" : reducedMotion ? lotes : counts[0] },
    { icon: Building2, label: "Municipios", value: municipios === undefined ? "—" : reducedMotion ? municipios : counts[1] },
    { icon: FileCheck, label: "8 áreas de análisis por lote" },
    { icon: Award, label: "Información verificada por expertos" },
  ];

  return (
    <section ref={ref} aria-label="Estadísticas y valor de la plataforma" className="border-b border-border bg-background py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 items-stretch gap-x-4 gap-y-8 px-4 md:grid-cols-4 md:gap-6">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-w-0 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1">
              {value !== undefined && <span className="font-body text-2xl font-bold tabular-nums text-secondary md:text-3xl">{value}</span>}
              <span className="max-w-full break-words font-body text-sm text-muted-foreground">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}