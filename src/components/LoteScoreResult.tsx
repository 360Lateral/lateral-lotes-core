import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { LoteScoreResult as ScoreResult } from "@/lib/loteScore";

interface Props {
  result: ScoreResult;
}

const levelConfig = {
  alto: {
    icon: Sparkles,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    title: "¡Tu lote está listo para recibir ofertas!",
    description:
      "Tiene toda la documentación necesaria y un perfil atractivo. El equipo 360 Lateral lo revisará y lo publicará para conectar con compradores calificados.",
  },
  medio: {
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    title: "Tu lote tiene potencial, pero puede mejorar",
    description:
      "Completa los factores faltantes para aumentar la visibilidad y atraer mejores ofertas. Solicita un Diagnóstico 360° para maximizar el valor.",
  },
  bajo: {
    icon: ShieldCheck,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    title: "Tu lote necesita viabilización",
    description:
      "Te recomendamos la Resolutoría 360° de 360 Lateral para preparar tu lote jurídica y técnicamente, y así obtener la mejor oferta posible.",
  },
};

const LoteScoreResult = ({ result }: Props) => {
  const navigate = useNavigate();
  const config = levelConfig[result.level];
  const LevelIcon = config.icon;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Header card */}
      <Card className={`border ${config.border} ${config.bg}`}>
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${config.bg}`}>
            <LevelIcon className={`h-8 w-8 ${config.color}`} />
          </div>
          <h2 className="font-body text-xl font-bold text-foreground">
            {config.title}
          </h2>
          <p className="max-w-md font-body text-sm text-muted-foreground">
            {config.description}
          </p>
        </CardContent>
      </Card>

      {/* Mandatory checklist */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-body text-sm font-semibold text-foreground">
            Requisitos obligatorios
          </h3>
          <div className="flex flex-col gap-3">
            {result.mandatory.map((m) => (
              <div key={m.key} className="flex items-start gap-3">
                {m.passed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                )}
                <div>
                  <p className={`font-body text-sm font-medium ${m.passed ? "text-foreground" : "text-destructive"}`}>
                    {m.label}
                  </p>
                  {!m.passed && (
                    <p className="font-body text-xs text-muted-foreground">
                      {m.hint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bonus score */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-body text-sm font-semibold text-foreground">
              Score de visibilidad
            </h3>
            <span className={`font-body text-lg font-bold ${config.color}`}>
              {result.bonusScore}/{result.maxBonusScore}
            </span>
          </div>
          <Progress value={(result.bonusScore / result.maxBonusScore) * 100} className="mb-5 h-3" />
          <div className="flex flex-col gap-3">
            {result.bonus.map((b) => (
              <div key={b.key} className="flex items-start gap-3">
                {b.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-sm text-foreground">{b.label}</p>
                    <span className={`font-body text-xs font-medium ${b.passed ? "text-success" : "text-muted-foreground"}`}>
                      +{b.points}/{b.maxPoints}
                    </span>
                  </div>
                  {!b.passed && (
                    <p className="font-body text-xs text-muted-foreground">
                      {b.hint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => navigate("/dashboard/lotes")}>
          Ver mis lotes
        </Button>
        {result.level !== "alto" && (
          <Button variant="outline" onClick={() => navigate("/diagnostico")}>
            Solicitar Diagnóstico 360°
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default LoteScoreResult;
