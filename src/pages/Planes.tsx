import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/ui/HeroImage";
import { Check, X } from "lucide-react";

const PLANES_IMG = "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1600&q=85";

const features = [
  "Valoración referencial por m²",
  "Score de viabilidad visual",
  "Análisis Normativo",
  "Análisis Jurídico",
  "Análisis SSPP",
  "Análisis de Suelos",
  "Análisis Ambiental",
  "Análisis de Mercado",
  "Análisis Arquitectónico",
  "Modelo Financiero Dinámico",
];

const planes = [
  {
    nombre: "Gratuito",
    precio: "$0",
    subprecio: null,
    included: [true, true, false, false, false, false, false, false, false, false],
    destacado: false,
    badge: null,
  },
  {
    nombre: "Básico",
    precio: "4 SMLMV",
    subprecio: "$7.003.620",
    included: [true, true, true, true, true, false, false, false, false, false],
    destacado: false,
    badge: null,
  },
  {
    nombre: "Pro",
    precio: "6 SMLMV",
    subprecio: "$10.505.430",
    included: [true, true, true, true, true, true, true, false, false, false],
    destacado: true,
    badge: "Más popular",
  },
  {
    nombre: "Premium",
    precio: "12 SMLMV",
    subprecio: "$21.010.860",
    included: [true, true, true, true, true, true, true, true, true, true],
    destacado: false,
    badge: null,
  },
];

const Planes = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroImage imageUrl={PLANES_IMG} height="200px" overlay="split">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
              Planes y precios
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-center text-white/70">
              Elige el nivel de análisis que necesitas para tu lote.
            </p>
          </div>
        </HeroImage>

        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4">
            {/* Desktop table */}
            <div className="mt-12 hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground" />
                    {planes.map((p) => (
                      <th key={p.nombre} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {p.badge && (
                            <span className="rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground">
                              {p.badge}
                            </span>
                          )}
                          <span className="font-heading text-lg font-bold text-secondary">
                            {p.nombre}
                          </span>
                          <span className="text-xl font-bold text-primary">{p.precio}</span>
                          {p.subprecio && (
                            <span className="text-xs text-muted-foreground">{p.subprecio}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-3 font-medium text-foreground">{f}</td>
                      {planes.map((p) => (
                        <td key={p.nombre} className="p-3 text-center">
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
                      <td key={p.nombre} className="p-3 text-center">
                        <Button asChild size="sm" variant={p.destacado ? "default" : "outline"}>
                          <Link to="/diagnostico">Solicitar</Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-10 grid grid-cols-1 gap-6 md:hidden">
              {planes.map((p) => (
                <div
                  key={p.nombre}
                  className={`rounded-xl border p-6 ${
                    p.destacado
                      ? "border-primary ring-2 ring-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  {p.badge && (
                    <span className="mb-3 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      {p.badge}
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-secondary">{p.nombre}</h3>
                  <p className="text-2xl font-bold text-primary">{p.precio}</p>
                  {p.subprecio && (
                    <p className="text-xs text-muted-foreground">{p.subprecio}</p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {features.map((f, i) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        {p.included[i] ? (
                          <Check className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={p.included[i] ? "text-foreground" : "text-muted-foreground/60"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full" variant={p.destacado ? "default" : "outline"}>
                    <Link to="/diagnostico">Solicitar</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Banner adicional */}
        <section className="bg-secondary py-12">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-heading text-xl font-bold text-white md:text-2xl">
              Servicio adicional
            </h2>
            <p className="mt-3 text-white/80 leading-relaxed">
              Estructuración, Gerencia y Desarrollo del lote completo. Honorarios + participación. A convenir.
            </p>
            <Button asChild size="lg" className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
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
