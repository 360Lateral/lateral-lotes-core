import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Puedo cambiar de plan en mitad del periodo?",
    a: "Sí, el cambio se prorratea según los días restantes de tu suscripción actual.",
  },
  {
    q: "¿Qué pasa cuando termina mi suscripción?",
    a: "Pierdes acceso al marketplace, pero los datos que hayas descargado son tuyos. Puedes renovar en cualquier momento.",
  },
  {
    q: "¿Cuántos lotes hay en el marketplace?",
    a: "[Número actual] activos publicados. El inventario crece cada semana con lotes validados por el equipo de 360Lateral.",
  },
  {
    q: "¿Por qué necesito firmar NDA?",
    a: "Para proteger la información de los propietarios y asegurar que las negociaciones se hagan a través de 360Lateral (que es como nos pagan nuestra comisión).",
  },
  {
    q: "¿Acepta tarjeta de crédito o débito?",
    a: "Sí, todos los pagos se procesan vía Wompi y aceptan tarjetas Visa, Mastercard, American Express, PSE y Nequi.",
  },
];

const SuscripcionFAQ = () => (
  <section className="py-12 lg:py-16">
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

export default SuscripcionFAQ;
