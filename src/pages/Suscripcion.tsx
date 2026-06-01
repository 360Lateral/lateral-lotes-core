import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreciosSuscripcion } from "@/hooks/usePreciosSuscripcion";
import { useMiSuscripcion } from "@/hooks/useMiSuscripcion";
import { useGenerarPagoWompi } from "@/hooks/useGenerarPagoWompi";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const NIVELES: { nivel: Exclude<NivelSuscripcion, "gratuito">; nombre: string; features: string[] }[] = [
  {
    nivel: "basico",
    nombre: "Básico",
    features: [
      "Área total exacta del lote",
      "Estrato y zona aproximada",
      "Tipo detallado",
      "Alertas por criterios de búsqueda",
    ],
  },
  {
    nivel: "profesional",
    nombre: "Profesional",
    features: [
      "Todo lo del plan Básico",
      "Dirección exacta y matrícula (con NDA)",
      "Coordenadas exactas y fotos reales",
      "Solicitar contacto con propietarios",
    ],
  },
  {
    nivel: "premium",
    nombre: "Premium",
    features: [
      "Todo lo del plan Profesional",
      "Precio estimado de venta",
      "Acceso a Análisis 360",
      "Notas del propietario",
    ],
  },
];

const PERIODOS = [
  { meses: 1, label: "1 mes" },
  { meses: 3, label: "3 meses" },
  { meses: 12, label: "12 meses" },
];

const Suscripcion = () => {
  const { isDesarrollador } = useAuth();
  const { data: precios, isLoading } = usePreciosSuscripcion();
  const { data: miSuscripcion } = useMiSuscripcion();
  const generarPago = useGenerarPagoWompi();
  const [periodo, setPeriodo] = useState<number>(1);
  const [submittingNivel, setSubmittingNivel] = useState<string | null>(null);

  const precioPorNivel = useMemo(() => {
    const map = new Map<string, number>();
    (precios ?? [])
      .filter((p) => p.periodo_meses === periodo)
      .forEach((p) => map.set(p.nivel, p.precio_cop));
    return map;
  }, [precios, periodo]);

  const handleSuscribirse = async (nivel: "basico" | "profesional" | "premium") => {
    setSubmittingNivel(nivel);
    try {
      const res = await generarPago.mutateAsync({
        tipo: "suscripcion",
        nivel,
        periodo_meses: periodo,
      });
      if (res?.payment_url) window.location.href = res.payment_url;
    } finally {
      setSubmittingNivel(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold">Planes de acceso al mercado</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Con una suscripción accedes a información detallada de los lotes publicados: área,
            ubicación, dirección, análisis 360 y precio estimado de venta.
          </p>
        </header>

        {miSuscripcion && (
          <Card className="p-5 bg-primary/5 border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">
                  Tu plan actual:{" "}
                  <span className="capitalize">{miSuscripcion.nivel}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Vence el{" "}
                  {miSuscripcion.fecha_fin
                    ? new Date(miSuscripcion.fecha_fin).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Suscripción activa</Badge>
          </Card>
        )}

        <div className="flex justify-center">
          <Tabs value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
            <TabsList>
              {PERIODOS.map((p) => (
                <TabsTrigger key={p.meses} value={String(p.meses)}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {NIVELES.map((n) => {
            const precio = precioPorNivel.get(n.nivel);
            const esActual = miSuscripcion?.nivel === n.nivel;
            const destacado = n.nivel === "profesional";
            return (
              <Card
                key={n.nivel}
                className={`p-6 flex flex-col ${
                  destacado ? "border-primary shadow-md" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{n.nombre}</h2>
                  {destacado && <Badge>Recomendado</Badge>}
                </div>
                <div className="mb-4">
                  {isLoading ? (
                    <p className="text-2xl font-bold text-muted-foreground">…</p>
                  ) : precio != null ? (
                    <>
                      <p className="text-3xl font-bold text-primary">{formatCOP(precio)}</p>
                      <p className="text-xs text-muted-foreground">
                        por {PERIODOS.find((p) => p.meses === periodo)?.label}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Precio no disponible</p>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {n.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {!isDesarrollador ? (
                  <Button disabled variant="outline" className="w-full">
                    Disponible para desarrolladores
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={destacado ? "default" : "outline"}
                    disabled={!precio || submittingNivel === n.nivel}
                    onClick={() => handleSuscribirse(n.nivel)}
                  >
                    {submittingNivel === n.nivel && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {esActual ? "Renovar este plan" : "Suscribirme"}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto">
          Pago único por el periodo elegido. Al vencer, podrás renovar manualmente. También puedes
          desbloquear lotes individuales por <Link to="/mi-cuenta" className="underline">pay-per-view</Link>.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Suscripcion;
