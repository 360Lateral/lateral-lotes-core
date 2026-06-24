import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, HelpCircle, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreciosSuscripcion } from "@/hooks/usePreciosSuscripcion";
import { useMiSuscripcion } from "@/hooks/useMiSuscripcion";
import { useGenerarPagoWompi } from "@/hooks/useGenerarPagoWompi";
import type { NivelSuscripcion } from "@/hooks/useNivelSuscripcion";
import PayPerViewBanner from "@/components/suscripcion/PayPerViewBanner";
import SuscripcionFAQ from "@/components/suscripcion/SuscripcionFAQ";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

interface FeatureItem {
  label: string;
  tech: string;
  description: string;
}

const NIVELES: {
  nivel: Exclude<NivelSuscripcion, "gratuito">;
  nombre: string;
  subtitulo: string;
  features: FeatureItem[];
}[] = [
  {
    nivel: "basico",
    nombre: "Básico",
    subtitulo: "Para empezar a explorar el mercado",
    features: [
      {
        label: "Tamaño exacto en m²",
        tech: "Área total exacta del lote",
        description: "Metros cuadrados verificados, no rangos aproximados.",
      },
      {
        label: "Zona socioeconómica de la propiedad",
        tech: "Estrato y zona aproximada",
        description: "Estrato y zona para evaluar perfil de comprador.",
      },
      {
        label: "Tipo de lote (residencial, comercial, etc.)",
        tech: "Tipo detallado",
        description: "Clasificación detallada del uso del suelo.",
      },
      {
        label: "Notificación cuando aparezca un lote como el que buscas",
        tech: "Alertas por criterios de búsqueda",
        description: "Recibes email cuando aparece un lote que matchea tu perfil.",
      },
    ],
  },
  {
    nivel: "profesional",
    nombre: "Profesional",
    subtitulo: "Para profesionales activos en el mercado",
    features: [
      {
        label: "Todo lo del plan Básico",
        tech: "Incluye todas las features del plan Básico",
        description: "Heredas tamaño, zona, tipo y alertas.",
      },
      {
        label: "Dirección y matrícula inmobiliaria",
        tech: "Dirección exacta y matrícula (con NDA)",
        description: "Requiere firmar Acuerdo de Confidencialidad.",
      },
      {
        label: "Ubicación GPS y fotos del lote",
        tech: "Coordenadas exactas y fotos reales",
        description: "Coordenadas GPS y galería fotográfica del activo.",
      },
      {
        label: "Contacto directo con el dueño",
        tech: "Solicitar contacto con propietarios",
        description: "Conexión tramitada por 360Lateral con el propietario.",
      },
    ],
  },
  {
    nivel: "premium",
    nombre: "Premium",
    subtitulo: "Para empresas y fondos",
    features: [
      {
        label: "Todo lo del plan Profesional",
        tech: "Incluye todas las features del plan Profesional",
        description: "Heredas dirección, GPS, fotos y contacto.",
      },
      {
        label: "Cuánto vale el lote en el mercado",
        tech: "Precio estimado de venta",
        description: "Valoración profesional con metodología comparable.",
      },
      {
        label: "Análisis técnico completo (jurídico, normativo, etc.)",
        tech: "Acceso a Análisis 360",
        description: "10 dimensiones técnicas del lote, listo para due diligence.",
      },
      {
        label: "Detalles que el propietario comparte",
        tech: "Notas del propietario",
        description: "Información extra que el propietario sube voluntariamente.",
      },
    ],
  },
];

const PERIODOS = [
  { meses: 1, label: "Mensual" },
  { meses: 3, label: "Trimestral" },
  { meses: 12, label: "Anual" },
];

const Suscripcion = () => {
  const { isDesarrollador } = useAuth();
  const { data: precios, isLoading } = usePreciosSuscripcion();
  const { data: miSuscripcion } = useMiSuscripcion();
  const generarPago = useGenerarPagoWompi();
  const [periodo, setPeriodo] = useState<number>(1);
  const [submittingNivel, setSubmittingNivel] = useState<string | null>(null);

  const precioPorNivelPeriodo = useMemo(() => {
    const map = new Map<string, number>(); // key: `${nivel}-${meses}`
    (precios ?? []).forEach((p) => map.set(`${p.nivel}-${p.periodo_meses}`, p.precio_cop));
    return map;
  }, [precios]);

  // Compute discount vs mensual price * meses for each periodo
  const descuentoPorPeriodo = useMemo(() => {
    const map = new Map<number, number>();
    PERIODOS.forEach(({ meses }) => {
      if (meses === 1) {
        map.set(meses, 0);
        return;
      }
      let totalDescuento = 0;
      let count = 0;
      NIVELES.forEach((n) => {
        const mensual = precioPorNivelPeriodo.get(`${n.nivel}-1`);
        const periodoPrecio = precioPorNivelPeriodo.get(`${n.nivel}-${meses}`);
        if (mensual && periodoPrecio) {
          const baseline = mensual * meses;
          const desc = (1 - periodoPrecio / baseline) * 100;
          if (desc > 0) {
            totalDescuento += desc;
            count += 1;
          }
        }
      });
      map.set(meses, count > 0 ? Math.round(totalDescuento / count) : 0);
    });
    return map;
  }, [precioPorNivelPeriodo]);

  const mejorDescuentoMeses = useMemo(() => {
    let mejor = 1;
    let max = 0;
    descuentoPorPeriodo.forEach((v, k) => {
      if (v > max) {
        max = v;
        mejor = k;
      }
    });
    return mejor;
  }, [descuentoPorPeriodo]);

  const precioPorNivel = useMemo(() => {
    const map = new Map<string, number>();
    NIVELES.forEach((n) => {
      const v = precioPorNivelPeriodo.get(`${n.nivel}-${periodo}`);
      if (v != null) map.set(n.nivel, v);
    });
    return map;
  }, [precioPorNivelPeriodo, periodo]);

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
        <header className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Acceso al marketplace de lotes con potencial inmobiliario
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Encuentra lotes pre-analizados por 360Lateral en Medellín y otras
            ciudades. Cada lote viene con su valoración, análisis técnico y datos
            del propietario.
          </p>
          <p className="text-sm text-muted-foreground">
            Elige el plan que se ajuste a tu volumen de búsqueda.
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
              {PERIODOS.map((p) => {
                const desc = descuentoPorPeriodo.get(p.meses) ?? 0;
                const esMejor = p.meses === mejorDescuentoMeses && desc > 0;
                return (
                  <TabsTrigger
                    key={p.meses}
                    value={String(p.meses)}
                    className="relative"
                  >
                    <span>{p.label}</span>
                    {desc > 0 && (
                      <span className="ml-1.5 text-[10px] font-semibold text-primary">
                        -{desc}%
                      </span>
                    )}
                    {esMejor && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                        ★
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {NIVELES.map((n) => {
            const precio = precioPorNivel.get(n.nivel);
            const esActual = miSuscripcion?.nivel === n.nivel;
            const destacado = n.nivel === "profesional";
            const requiereAcuerdo =
              n.nivel === "profesional" || n.nivel === "premium";
            const esBasico = n.nivel === "basico";
            return (
              <Card
                key={n.nivel}
                className={`p-6 flex flex-col ${
                  destacado ? "border-primary shadow-md" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-semibold">{n.nombre}</h2>
                  {destacado && <Badge>Recomendado</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-4 min-h-[2.5rem]">
                  {n.subtitulo}
                </p>
                <div className="mb-4">
                  {isLoading ? (
                    <p className="text-2xl font-bold text-muted-foreground">…</p>
                  ) : precio != null ? (
                    <>
                      <p className="text-3xl font-bold text-primary">
                        {formatCOP(precio)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        por {PERIODOS.find((p) => p.meses === periodo)?.label.toLowerCase()}
                        {periodo > 1 && (
                          <>
                            {" "}
                            · {formatCOP(Math.round(precio / periodo))}/mes
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Precio no disponible</p>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {n.features.map((f) => (
                    <li key={f.label} className="flex gap-2 text-sm items-start">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-start gap-1 cursor-help">
                              <span>{f.label}</span>
                              <HelpCircle className="h-3 w-3 text-muted-foreground/60 mt-0.5 shrink-0" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold text-xs">{f.tech}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {f.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  ))}
                </ul>
                {requiereAcuerdo ? (
                  <p className="text-xs text-muted-foreground bg-muted/40 border rounded-md p-2 mb-3 leading-snug">
                    Este plan da acceso a información identificable de los activos.
                    Para verla, deberás aceptar el Acuerdo de Confidencialidad y No
                    Elusión (tramitar negocios solo a través de 360Lateral).
                  </p>
                ) : esBasico ? (
                  <p className="text-xs text-muted-foreground bg-muted/40 border rounded-md p-2 mb-3 leading-snug">
                    Plan sin información identificable de propietarios. Para
                    acceder a dirección, contacto y matrícula, considera
                    Profesional o Premium.
                  </p>
                ) : null}
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

        <PayPerViewBanner />

        <p className="text-center text-xs text-muted-foreground max-w-xl mx-auto">
          Pago único por el periodo elegido. Al vencer, podrás renovar
          manualmente. También puedes ver historial de pagos en{" "}
          <Link to="/mi-cuenta" className="underline">
            mi cuenta
          </Link>
          .
        </p>
      </div>

      <SuscripcionFAQ />

      <Footer />
    </div>
  );
};

export default Suscripcion;
