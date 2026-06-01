import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, ShieldCheck, ExternalLink } from "lucide-react";
import { useMiSuscripcion } from "@/hooks/useMiSuscripcion";
import { useMisAccesosLote } from "@/hooks/useMisAccesosLote";
import { useAuth } from "@/contexts/AuthContext";

const formatDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

const MiCuentaDesarrollador = () => {
  const { isDesarrollador } = useAuth();
  const { data: suscripcion, isLoading: loadingSub } = useMiSuscripcion();
  const { data: accesos, isLoading: loadingAcc } = useMisAccesosLote();

  const accesosActivos = (accesos ?? []).filter(
    (a) => a.estado === "activa" && a.fecha_expiracion && new Date(a.fecha_expiracion) > new Date(),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-semibold">Mi cuenta</h1>
          <p className="text-muted-foreground">
            Gestiona tu suscripción y los lotes que has desbloqueado.
          </p>
        </header>

        {!isDesarrollador && (
          <Card className="p-4 bg-muted/30 border-dashed text-sm text-muted-foreground">
            Esta sección está pensada para usuarios desarrolladores. Algunas acciones de pago no
            estarán disponibles para tu perfil.
          </Card>
        )}

        {/* Suscripción */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Mi suscripción</h2>
          {loadingSub ? (
            <Skeleton className="h-28 w-full" />
          ) : suscripcion ? (
            <Card className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">
                    Plan <span className="capitalize">{suscripcion.nivel}</span> ·{" "}
                    {suscripcion.periodo_meses} {suscripcion.periodo_meses === 1 ? "mes" : "meses"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vence el {formatDate(suscripcion.fecha_fin)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">Activa</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link to="/suscripcion">Renovar o cambiar</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-5 border-dashed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium">Sin suscripción activa</p>
                <p className="text-sm text-muted-foreground">
                  Explora los planes para acceder a información detallada de los lotes.
                </p>
              </div>
              <Button asChild>
                <Link to="/suscripcion">Ver planes</Link>
              </Button>
            </Card>
          )}
        </section>

        {/* Lotes desbloqueados */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Lotes desbloqueados</h2>
          {loadingAcc ? (
            <Skeleton className="h-32 w-full" />
          ) : accesosActivos.length === 0 ? (
            <Card className="p-5 border-dashed text-sm text-muted-foreground">
              Aún no has desbloqueado ningún lote individualmente. Desde la ficha de un lote puedes
              usar la opción "Desbloquear solo este lote" para acceder por un periodo limitado.
            </Card>
          ) : (
            <div className="space-y-3">
              {accesosActivos.map((a) => (
                <Card
                  key={a.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm">{a.lote_id.slice(0, 8)}…</p>
                      <p className="text-xs text-muted-foreground">
                        Acceso desbloqueado · vence el {formatDate(a.fecha_expiracion)}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/lotes/${a.lote_id}`}>
                      Ver lote <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default MiCuentaDesarrollador;
