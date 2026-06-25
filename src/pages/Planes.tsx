import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/ui/HeroImage";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, HelpCircle, MessageCircle, Table as TableIcon, X } from "lucide-react";
import { usePlanesConPrecio, type PlanConPrecio } from "@/hooks/usePlanesConPrecio";
import { useSmlmvVigente } from "@/hooks/useSmlmvVigente";
import PlanesFAQ from "@/components/planes/PlanesFAQ";
import { formatCOP } from "@/lib/format-moneda";

const PLANES_IMG =
  "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1600&q=85";

// Features in client-facing language with the technical name for tooltips.
// Each feature also has an index that maps onto fallback inclusion arrays.
const FEATURES: {
  label: string;
  tech: string;
  description: string;
  // boolean per fallback plan (gratuito, basico, pro, premium)
  fallback: [boolean, boolean, boolean, boolean];
}[] = [
  {
    label: "Cuánto vale tu lote en valores de mercado",
    tech: "Valoración por m²",
    description: "Precio referencial calculado a partir de comparables de la zona.",
    fallback: [true, true, true, true],
  },
  {
    label: "Indicador rápido del potencial del lote",
    tech: "Score de viabilidad visual",
    description: "Semáforo que resume el potencial del lote en una sola mirada.",
    fallback: [true, true, true, true],
  },
  {
    label: "Qué puedes construir según norma POT",
    tech: "Análisis Normativo",
    description: "Usos permitidos, alturas, índices y aprovechamientos del POT.",
    fallback: [false, true, true, true],
  },
  {
    label: "Estado legal y riesgos jurídicos",
    tech: "Análisis Jurídico",
    description: "Tradición del inmueble, gravámenes, limitaciones y observaciones.",
    fallback: [false, true, true, true],
  },
  {
    label: "Acueducto, electricidad y servicios disponibles",
    tech: "Análisis SSPP",
    description: "Disponibilidad de servicios públicos y costos estimados de conexión.",
    fallback: [false, true, true, true],
  },
  {
    label: "Capacidad portante del terreno",
    tech: "Análisis Geotécnico",
    description: "Calidad del suelo, riesgos y condiciones para cimentación.",
    fallback: [false, false, true, true],
  },
  {
    label: "Restricciones ambientales (zonas protegidas, etc.)",
    tech: "Análisis Ambiental",
    description: "Riesgos, áreas de manejo especial y permisos ambientales.",
    fallback: [false, false, true, true],
  },
  {
    label: "Comparables y demanda de la zona",
    tech: "Análisis de Mercado",
    description: "Lotes y proyectos comparables, precios y dinámica de la zona.",
    fallback: [false, false, false, true],
  },
  {
    label: "Cuántas viviendas/oficinas se podrían construir",
    tech: "Análisis Arquitectónico",
    description: "Esquema de aprovechamiento y mix de productos viable.",
    fallback: [false, false, false, true],
  },
  {
    label: "Simulación de rentabilidad y escenarios",
    tech: "Modelo Financiero Dinámico",
    description: "Proyección de TIR, VAN y escenarios sensibilizados.",
    fallback: [false, false, false, true],
  },
];

interface PlanRow {
  id: string;
  codigo: string;
  nombre: string;
  precioLabel: string;
  precioSubLabel: string;
  descripcion: string;
  paraQuien: string;
  destacado: boolean;
  included: boolean[];
}

const FALLBACK_PLANS: Omit<PlanRow, "included">[] = [
  {
    id: "gratuito",
    codigo: "gratuito",
    nombre: "Gratuito",
    precioLabel: "$0",
    precioSubLabel: "Solo registro",
    descripcion: "Para explorar el potencial inicial",
    paraQuien: "Vendedores casuales o exploración inicial",
    destacado: false,
  },
  {
    id: "basico",
    codigo: "basico",
    nombre: "Básico",
    precioLabel: "4 SMLMV",
    precioSubLabel: "Pago único",
    descripcion: "Para evaluar viabilidad legal y normativa",
    paraQuien: "Propietarios que quieren certeza legal y normativa",
    destacado: false,
  },
  {
    id: "pro",
    codigo: "pro",
    nombre: "Pro",
    precioLabel: "6 SMLMV",
    precioSubLabel: "Pago único",
    descripcion: "Para decidir inversión",
    paraQuien: "Inversionistas que quieren saber el retorno esperado",
    destacado: true,
  },
  {
    id: "premium",
    codigo: "premium",
    nombre: "Premium",
    precioLabel: "12 SMLMV",
    precioSubLabel: "Pago único",
    descripcion: "Para desarrollar un proyecto",
    paraQuien: "Desarrolladores profesionales que van a construir o asociarse",
    destacado: false,
  },
];

const FeatureLabel = ({
  label,
  tech,
  description,
}: {
  label: string;
  tech: string;
  description: string;
}) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 cursor-help">
          {label}
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold text-xs">{tech}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const PlanTabla = ({ planes }: { planes: PlanRow[] }) => (
  <table className="w-full text-sm">
    <thead>
      <tr>
        <th className="text-left p-3 font-medium text-muted-foreground w-1/3" />
        {planes.map((p) => (
          <th key={p.id} className="p-3 text-center align-top">
            <div className="flex flex-col items-center gap-1">
              {p.destacado && (
                <span className="rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Más popular
                </span>
              )}
              <span className="font-heading text-lg font-bold text-secondary">
                {p.nombre}
              </span>
              <span className="text-xs text-muted-foreground max-w-[12rem] leading-tight">
                {p.descripcion}
              </span>
              <span className="mt-1 text-xl font-bold text-primary">{p.precioLabel}</span>
              <span className="text-xs text-muted-foreground">{p.precioSubLabel}</span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {FEATURES.map((f, i) => (
        <tr key={f.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
          <td className="p-3 font-medium text-foreground">
            <FeatureLabel label={f.label} tech={f.tech} description={f.description} />
          </td>
          {planes.map((p) => (
            <td key={p.id} className="p-3 text-center">
              {p.included[i] ? (
                <Check className="mx-auto h-5 w-5 text-success" />
              ) : (
                <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
              )}
            </td>
          ))}
        </tr>
      ))}
      <tr>
        <td />
        {planes.map((p) => (
          <td key={p.id} className="p-3 text-center">
            <Button asChild size="sm" variant={p.destacado ? "default" : "outline"}>
              <Link to="/diagnostico">{p.codigo === "gratuito" ? "Empezar gratis" : "Comprar plan"}</Link>
            </Button>
          </td>
        ))}
      </tr>
    </tbody>
  </table>
);

const Planes = () => {
  const { data: planesRemotos } = usePlanesConPrecio();
  const { data: smlmv } = useSmlmvVigente();
  const [tablaAbierta, setTablaAbierta] = useState(false);

  // Map remote plan rows onto our display rows; fallback to defaults if remote query fails.
  const planes: PlanRow[] = useMemo(() => {
    const includedFor = (codigo: string, remote: PlanConPrecio | undefined): boolean[] => {
      // Without a planes_analisis matrix to consume, derive inclusion from
      // the fallback table — we still respect the remote's plan order/identity.
      const fb = FALLBACK_PLANS.find((p) => p.codigo === codigo);
      const idx = FALLBACK_PLANS.findIndex((p) => p.codigo === codigo);
      if (!fb || idx === -1) return FEATURES.map(() => false);
      return FEATURES.map((f) => f.fallback[idx]);
    };

    if (planesRemotos && planesRemotos.length) {
      return planesRemotos
        .filter((p) => p.activo)
        .map((p) => {
          const factor = Number(p.precio_smlmv) || 0;
          const monto = factor && smlmv?.monto ? factor * smlmv.monto : Number(p.precio_cop_actual) || 0;
          const precioLabel = factor === 0 ? "$0" : `${factor} SMLMV`;
          const precioSub = factor === 0 ? "Solo registro" : `≈ ${formatCOP(monto)}`;
          return {
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            precioLabel,
            precioSubLabel: precioSub,
            descripcion: p.descripcion_corta ?? FALLBACK_PLANS.find((f) => f.codigo === p.codigo)?.descripcion ?? "",
            paraQuien: p.para_quien ?? FALLBACK_PLANS.find((f) => f.codigo === p.codigo)?.paraQuien ?? "",
            destacado: p.recomendado,
            included: includedFor(p.codigo, p),
          };
        });
    }

    return FALLBACK_PLANS.map((p, idx) => ({
      ...p,
      included: FEATURES.map((f) => f.fallback[idx]),
    }));
  }, [planesRemotos, smlmv]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroImage imageUrl={PLANES_IMG} height="260px" overlay="split">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
              ¿Cuánto vale tu lote? ¿Qué puedes construir en él?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-white/80 leading-relaxed">
              Activamos por ti un análisis técnico completo (jurídico, normativo,
              ambiental, financiero) para que sepas exactamente su potencial.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-center text-white/70 text-sm">
              Eliges cuánto análisis necesitas, pagas una vez, recibes los
              resultados en 7 días.
            </p>
          </div>
        </HeroImage>

        {/* "Para quién es cada plan" */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-heading text-xl font-bold text-secondary text-center md:text-2xl">
              ¿Para quién es cada plan?
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {planes.map((p) => (
                <Card
                  key={`pq-${p.id}`}
                  className={`p-4 ${p.destacado ? "border-primary" : ""}`}
                >
                  <p className="font-heading text-sm font-bold text-secondary">{p.nombre}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-snug">
                    {p.paraQuien}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tabla / cards */}
        <section className="pb-16 lg:pb-20">
          <div className="mx-auto max-w-6xl px-4">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-background">
              <PlanTabla planes={planes} />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              <Sheet open={tablaAbierta} onOpenChange={setTablaAbierta}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <TableIcon className="mr-2 h-4 w-4" />
                    Ver tabla comparativa
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Comparar planes</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 overflow-x-auto">
                    <PlanTabla planes={planes} />
                  </div>
                </SheetContent>
              </Sheet>

              {planes.map((p) => (
                <Card
                  key={p.id}
                  className={`p-6 ${
                    p.destacado ? "border-primary ring-2 ring-primary bg-primary/5" : ""
                  }`}
                >
                  {p.destacado && (
                    <span className="mb-3 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Más popular
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-secondary">{p.nombre}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.descripcion}</p>
                  <p className="mt-3 text-2xl font-bold text-primary">{p.precioLabel}</p>
                  <p className="text-xs text-muted-foreground">{p.precioSubLabel}</p>
                  <ul className="mt-4 space-y-2">
                    {FEATURES.map((f, i) => (
                      <li key={f.label} className="flex items-start gap-2 text-sm">
                        {p.included[i] ? (
                          <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-0.5" />
                        )}
                        <span
                          className={
                            p.included[i] ? "text-foreground" : "text-muted-foreground/60"
                          }
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6 w-full"
                    variant={p.destacado ? "default" : "outline"}
                  >
                    <Link to="/diagnostico">
                      {p.codigo === "gratuito" ? "Empezar gratis" : "Comprar plan"}
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>

            {/* Secondary CTA */}
            <div className="mt-10 rounded-lg border border-border bg-muted/30 p-6 text-center">
              <p className="font-heading text-lg font-semibold text-secondary">
                ¿No estás seguro qué plan elegir?
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="default">
                  <a
                    href="https://wa.me/573000000000"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Hablar con un asesor
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#casos-exito">Ver casos de éxito</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Casos de éxito placeholder */}
        <section id="casos-exito" className="py-12 bg-background">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-heading text-xl font-bold text-secondary md:text-2xl">
              Casos de éxito
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Próximamente — historias reales de propietarios que valoraron y
              vendieron mejor su lote con 360Lateral.
            </p>
          </div>
        </section>

        <PlanesFAQ />

        {/* Banner adicional */}
        <section className="bg-secondary py-12">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-heading text-xl font-bold text-white md:text-2xl">
              Servicio adicional
            </h2>
            <p className="mt-3 text-white/80 leading-relaxed">
              Estructuración, Gerencia y Desarrollo del lote completo.
              Honorarios + participación. A convenir.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link to="/diagnostico">Contáctanos</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Planes;
