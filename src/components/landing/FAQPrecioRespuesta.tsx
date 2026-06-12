import { usePlanesConPrecio } from "@/hooks/usePlanesConPrecio";
import { usePreciosSuscripcion } from "@/hooks/usePreciosSuscripcion";

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const FAQPrecioRespuesta = () => {
  const { data: planes, isLoading: loadingPlanes, error: errPlanes } = usePlanesConPrecio();
  const { data: suscripciones, isLoading: loadingSusc, error: errSusc } = usePreciosSuscripcion();

  if (errPlanes || errSusc) {
    return (
      <p className="font-body text-sm text-muted-foreground">
        Publicar tu lote es gratis. Para conocer los planes de diagnóstico y suscripciones, ingresa al onboarding.
      </p>
    );
  }

  if (loadingPlanes || loadingSusc) {
    return (
      <p className="font-body text-sm text-muted-foreground">
        Publicar tu lote es gratis. Para desarrolladores ofrecemos suscripciones flexibles. Cargando precios…
      </p>
    );
  }

  const planMin = planes
    ?.filter((p) => p.activo && p.precio_cop_actual > 0)
    .sort((a, b) => a.precio_cop_actual - b.precio_cop_actual)[0];

  const suscMin = suscripciones
    ?.filter((s) => s.activo && s.precio_cop > 0)
    .sort((a, b) => a.precio_cop / a.periodo_meses - b.precio_cop / b.periodo_meses)[0];

  return (
    <div className="font-body text-sm text-muted-foreground space-y-2">
      <p>
        Publicar tu lote es <strong className="text-foreground">gratis</strong>. Solo cobras cuando decides contratar un diagnóstico profesional.
      </p>
      {planMin && (
        <p>
          <strong className="text-foreground">Para propietarios:</strong> diagnóstico {planMin.nombre.toLowerCase()} desde{" "}
          <strong className="text-foreground">{formatoCOP.format(planMin.precio_cop_actual)}</strong>{" "}
          ({planMin.precio_smlmv} SMLMV).
        </p>
      )}
      {suscMin && (
        <p>
          <strong className="text-foreground">Para desarrolladores:</strong> suscripción desde{" "}
          <strong className="text-foreground">
            {formatoCOP.format(Math.round(suscMin.precio_cop / suscMin.periodo_meses))}/mes
          </strong>
          {suscMin.periodo_meses > 1 && (
            <span> (facturada cada {suscMin.periodo_meses} meses)</span>
          )}
          .
        </p>
      )}
      {!planMin && !suscMin && (
        <p>Consulta nuestros planes en el onboarding para conocer los precios actualizados.</p>
      )}
    </div>
  );
};

export default FAQPrecioRespuesta;
