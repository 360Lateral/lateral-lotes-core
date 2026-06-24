import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSmlmvVigente } from "@/hooks/useSmlmvVigente";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const PlanesFAQ = () => {
  const { data: smlmv } = useSmlmvVigente();

  const faqs = [
    {
      q: "¿Qué pasa si necesito más análisis después?",
      a: "Puedes actualizar a un plan superior pagando la diferencia. Tu progreso se conserva.",
    },
    {
      q: "¿En cuánto tiempo recibo los resultados?",
      a: "7 días hábiles desde la activación del plan. [Confirmar SLA con admin]",
    },
    {
      q: "¿Qué es SMLMV?",
      a: smlmv
        ? `Salario Mínimo Mensual Legal Vigente en Colombia. Hoy 1 SMLMV = ${formatCOP(smlmv.monto)} (año ${smlmv.anio}). Se actualiza automáticamente al inicio de cada año.`
        : "Salario Mínimo Mensual Legal Vigente en Colombia, actualizado cada año.",
    },
    {
      q: "¿Puedo pagar con tarjeta?",
      a: "Sí, aceptamos todas las tarjetas vía Wompi (la pasarela de pagos colombiana).",
    },
    {
      q: "¿Es reembolsable?",
      a: "[Política a confirmar con el admin]",
    },
  ];

  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-heading text-2xl font-bold text-secondary text-center md:text-3xl">
          Preguntas frecuentes
        </h2>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-sm font-medium md:text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default PlanesFAQ;
