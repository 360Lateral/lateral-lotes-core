import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-white px-4">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-white/30 mb-4">⚠️</div>
            <h1 className="text-2xl font-semibold text-white">Algo salió mal</h1>
            <p className="mt-2 text-sm text-white/70">
              Ocurrió un error inesperado. Por favor recarga la página o vuelve al inicio.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg px-5 py-2.5 text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Recargar página
            </button>
            <a
              href="/"
              className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: "#E8951A", color: "#0f1d3a" }}
            >
              Ir al inicio
            </a>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-8 max-w-lg overflow-auto rounded bg-white/10 p-4 text-xs text-white/80">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
