import { useEffect, useState, useRef } from "react";

interface UseCountUpOptions {
  target: number;
  durationMs?: number;
  startWhenInView?: boolean;
}

export const useCountUp = ({
  target,
  durationMs = 1400,
  startWhenInView = true,
}: UseCountUpOptions) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const animate = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!startWhenInView) {
      animate();
      return;
    }
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true;
          animate();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, durationMs, startWhenInView]);

  return { value, ref };
};
