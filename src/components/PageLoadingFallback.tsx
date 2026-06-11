import { Loader2 } from "lucide-react";

const PageLoadingFallback = () => (
  <div
    className="flex min-h-[60vh] w-full items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
      <span className="font-body text-sm">Cargando…</span>
    </div>
  </div>
);

export default PageLoadingFallback;
