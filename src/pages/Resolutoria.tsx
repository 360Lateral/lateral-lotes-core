import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/ui/HeroImage";
import {
  FileText,
  Scale,
  Droplets,
  Mountain,
  TrendingUp,
  Leaf,
  Building2,
  Calculator,
  CheckCircle2,
} from "lucide-react";

const RESOLUTORIA_IMG = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85";

const areas = [
  { icon: FileText, nombre: "Normativo", entregable: "FCN + Ficha Resumen" },
  { icon: Scale, nombre: "Jurídico", entregable: "Due Diligence + Matriz de Riesgos" },
  { icon: Droplets, nombre: "SSPP", entregable: "Carta de Disponibilidad de Servicios" },
  { icon: Mountain, nombre: "Suelos", entregable: "Concepto Geotécnico" },
  { icon: TrendingUp, nombre: "Mercado", entregable: "Estudio de Mercado" },
  { icon: Leaf, nombre: "Ambiental", entregable: "Concepto de Restricción Ambiental" },
  { icon: Building2, nombre: "Arquitectónico", entregable: "Cabida Arquitectónica" },
  { icon: Calculator, nombre: "Financiero", entregable: "Modelo Financiero Dinámico" },
];

const planes = [
  { nombre: "Básico", precio: "4 SMLMV", cop: "$7.003.620", areas: "3 áreas", destacado: false },
  { nombre: "Pro", precio: "6 SMLMV", cop: "$10.505.430", areas: "5 áreas", destacado: true },
  { nombre: "Premium", precio: "12 SMLMV", cop: "$21.010.860", areas: "8 áreas completas", destacado: false },
];

const resultados = [
  "Valor real de la tierra",
  "Qué se puede desarrollar",
  "Mayor y mejor uso posible",
];

const Resolutoria = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* HERO */}
        <section className="bg-secondary py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-heading text-4xl font-bold text-white md:text-5xl">
              Resolutoría 360°
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              El análisis completo que transforma cualquier lote en una oportunidad viable y financieramente documentada.
            </p>
            <Button asChild size="xl" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/diagnostico">Solicitar mi Resolutoría</Link>
            </Button>
          </div>
        </section>

        {/* QUÉ ES */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-heading text-2xl font-bold text-secondary md:text-3xl">
              ¿Qué es la Resolutoría?
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              La Resolutoría 360° es el proceso de viabilización más completo disponible en Colombia para lotes urbanos y rurales. Analizamos 8 áreas de conocimiento para darte una visión financiera real de tu predio.
            </p>
          </div>
        </section>

        {/* 8 ÁREAS */}
        <section className="bg-muted/30 py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-heading text-2xl font-bold text-secondary text-center mb-10 md:text-3xl">
              Las 8 áreas de análisis
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {areas.map((a) => (
                <div
                  key={a.nombre}
                  className="rounded-xl border border-border bg-card p-6 text-center"
                >
                  <a.icon className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="mt-3 font-heading text-sm font-bold text-secondary">
                    {a.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{a.entregable}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTADO */}
        <section className="bg-secondary py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
              Resultado: Teaser Financiero 360°
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {resultados.map((r) => (
                <div key={r} className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <p className="text-white font-medium">{r}</p>
                </div>
              ))}
            </div>
            <Button asChild size="xl" className="mt-10 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/diagnostico">Quiero mi Teaser Financiero</Link>
            </Button>
          </div>
        </section>

        {/* PLANES */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-heading text-2xl font-bold text-secondary text-center mb-10 md:text-3xl">
              Planes y precios
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {planes.map((p) => (
                <div
                  key={p.nombre}
                  className={`rounded-xl border p-8 text-center flex flex-col ${
                    p.destacado
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border bg-card"
                  }`}
                >
                  {p.destacado && (
                    <span className="mx-auto mb-4 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Más popular
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-secondary">
                    {p.nombre}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-primary">{p.precio}</p>
                  <p className="text-xs text-muted-foreground">{p.cop}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.areas}</p>
                  <Button asChild className="mt-auto pt-6">
                    <Link to="/diagnostico">Solicitar este plan</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Resolutoria;
