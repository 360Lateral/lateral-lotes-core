import { Component, ReactNode } from "react";
import { MapPin } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

const DefaultFallback = () => (
  <div className="flex h-full w-full flex-col items-center justify-center bg-muted px-6 text-center">
    <MapPin className="h-8 w-8 text-muted-foreground mb-3" />
    <p className="text-sm font-semibold text-foreground">Mapa no disponible temporalmente</p>
    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
      El listado de lotes sigue funcionando con los filtros del panel.
    </p>
  </div>
);

class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("Map error boundary caught:", error);
  }
  render() {
    if (this.state.hasError) return <>{this.props.fallback ?? <DefaultFallback />}</>;
    return this.props.children;
  }
}

export default MapErrorBoundary;
export { DefaultFallback as MapFallback };
