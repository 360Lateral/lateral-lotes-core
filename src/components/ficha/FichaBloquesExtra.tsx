import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  Briefcase,
  Building,
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Home,
  LayoutGrid,
  Leaf,
  Maximize,
  Mountain,
  Plug,
  Scale,
  Target,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formatCOPCompact } from "@/lib/format";
import type {
  ArquitectonicoLote,
  CodigoAnalisis,
  FichaEnriquecidaData,
  FinancieroLote,
  HallazgoArea,
  MercadoLote,
  NivelHallazgo,
  NormativaLote,
} from "@/hooks/useFichaEnriquecida";
import {
import { formatNumero } from "@/lib/format-moneda";
  derivarPerfilesCompradorIdeal,
  type PerfilCompradorIdeal,
} from "@/lib/perfil-comprador";

// ---------- helpers ----------

const fmtNum = (v: number | null | undefined, decimales = 0): string =>
  v == null ? "—" : formatNumero(Number(v), decimales);

const fmtPct = (v: number | null | undefined): string =>
  v == null ? "—" : `${Number(v).toFixed(1)}%`;

// ---------- DataChip ----------

interface DataChipProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  destacado?: boolean;
}

export const DataChip = ({ icon: Icon, label, value, destacado }: DataChipProps) => (
  <div
    className={cn(
      "rounded-md border p-3",
      destacado ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border",
    )}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </span>
    </div>
    <p
      className={cn(
        "font-display font-bold",
        destacado ? "text-xl text-primary" : "text-base text-foreground",
      )}
    >
      {value}
    </p>
  </div>
);

// ---------- KPIFinanciero ----------

interface KPIFinancieroProps {
  label: string;
  value: number | null | undefined;
  format: "cop" | "percentage";
  suffix?: string;
  descripcion?: string;
  icon: LucideIcon;
  destacado?: boolean;
}

export const KPIFinancieroCard = ({
  label,
  value,
  format,
  suffix,
  descripcion,
  icon: Icon,
  destacado,
}: KPIFinancieroProps) => {
  const formatted =
    value == null
      ? "—"
      : format === "cop"
        ? formatCOPCompact(Number(value))
        : `${Number(value).toFixed(1)}%`;

  return (
    <div
      className={cn(
        "rounded-md border p-3",
        destacado ? "bg-emerald-50/70 border-emerald-200" : "bg-muted/30 border-border",
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            destacado ? "text-emerald-600" : "text-muted-foreground",
          )}
        />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "font-display font-bold",
          destacado ? "text-2xl text-emerald-900" : "text-lg text-foreground",
        )}
      >
        {formatted}
        {suffix && value != null && <span className="text-xs font-normal"> {suffix}</span>}
      </p>
      {descripcion && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{descripcion}</p>
      )}
    </div>
  );
};

// ---------- AnalisisAreaCard (con semáforo + colapsable) ----------

interface AreaDef {
  codigo: CodigoAnalisis;
  nombre: string;
  icon: LucideIcon;
  descripcion: string;
}

export const ANALISIS_AREAS: AreaDef[] = [
  { codigo: "juridico", nombre: "Jurídico", icon: Scale, descripcion: "Estado legal del lote" },
  { codigo: "normativo", nombre: "Normativo", icon: FileText, descripcion: "Norma POT aplicable" },
  { codigo: "ambiental", nombre: "Ambiental", icon: Leaf, descripcion: "Restricciones ambientales" },
  { codigo: "sspp", nombre: "Servicios públicos", icon: Plug, descripcion: "Acueducto, energía, gas" },
  { codigo: "geotecnico", nombre: "Suelos", icon: Mountain, descripcion: "Capacidad del terreno" },
  { codigo: "mercado", nombre: "Mercado", icon: TrendingUp, descripcion: "Comparables y demanda" },
  { codigo: "arquitectonico", nombre: "Arquitectónico", icon: LayoutGrid, descripcion: "Lo que se puede construir" },
  { codigo: "financiero", nombre: "Financiero", icon: Calculator, descripcion: "Rentabilidad esperada" },
];

const SEMAFORO: Record<
  NivelHallazgo,
  { Icon: LucideIcon; color: string; bg: string }
> = {
  ok: {
    Icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/60",
  },
  warning: {
    Icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200 hover:bg-amber-100/60",
  },
  critical: {
    Icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 hover:bg-red-100/60",
  },
  pending: {
    Icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted/30 border-border hover:bg-muted/50",
  },
};

const AnalisisAreaCard = ({
  area,
  score,
  hallazgos,
}: {
  area: AreaDef;
  score: number | null;
  hallazgos: HallazgoArea[];
}) => {
  const [open, setOpen] = useState(false);
  const nivel: NivelHallazgo =
    score == null ? "pending" : score >= 7 ? "ok" : score >= 4 ? "warning" : "critical";
  const cfg = SEMAFORO[nivel];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-md border p-3 text-left transition-colors",
            cfg.bg,
          )}
        >
          <div className="flex items-start gap-2">
            <area.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{area.nombre}</p>
                <cfg.Icon className={cn("h-4 w-4 flex-shrink-0", cfg.color)} />
              </div>
              <p className="text-[10px] text-muted-foreground">{area.descripcion}</p>
              {score != null ? (
                <p className="font-display font-bold text-lg mt-1">
                  {score.toFixed(1)}
                  <span className="text-xs text-muted-foreground">/10</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 italic">Pendiente</p>
              )}
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {hallazgos.length > 0 ? (
          <div className="px-3 pb-2 space-y-1">
            {hallazgos.map((h, idx) => (
              <p key={idx} className="text-xs flex items-start gap-1">
                <span className={cn("font-bold", cfg.color)}>•</span>
                <span>{h.mensaje}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground px-3 pb-2 italic">
            {score == null ? "Análisis pendiente." : "Sin hallazgos críticos."}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

// ---------- Bloques de sección ----------

const BloqueAprovechamiento = ({
  arq,
  normativa,
}: {
  arq: ArquitectonicoLote;
  normativa: NormativaLote | null;
}) => {
  const tieneAislamientos =
    !!normativa &&
    (normativa.aislamiento_frontal_m != null ||
      normativa.aislamiento_lateral_m != null ||
      normativa.aislamiento_posterior_m != null);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Aprovechamiento arquitectónico</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 mb-4">
        <DataChip
          icon={Maximize}
          label="Área construible"
          value={arq.m2_construibles_total != null ? `${fmtNum(arq.m2_construibles_total)} m²` : "—"}
          destacado
        />
        <DataChip
          icon={Home}
          label="Unidades estimadas"
          value={arq.unidades_estimadas ?? "—"}
          destacado
        />
        <DataChip
          icon={LayoutGrid}
          label="Área vendible"
          value={arq.area_vendible_pct != null ? fmtPct(arq.area_vendible_pct) : "—"}
        />
        <DataChip
          icon={Target}
          label="Eficiencia del lote"
          value={arq.eficiencia_lote_pct != null ? fmtPct(arq.eficiencia_lote_pct) : "—"}
        />
        <DataChip
          icon={LayoutGrid}
          label="Tipologías"
          value={arq.tipologias ?? "—"}
        />
        <DataChip icon={Building} label="Forma del lote" value={arq.forma_lote ?? "—"} />
        <DataChip
          icon={ArrowDown}
          label="Sótano"
          value={
            arq.permite_sotano == null ? "—" : arq.permite_sotano ? "Permitido" : "No permitido"
          }
        />
      </div>

      {tieneAislamientos && (
        <div className="border-t pt-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Aislamientos requeridos
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {normativa?.aislamiento_frontal_m != null && (
              <span>
                Frontal: <strong>{normativa.aislamiento_frontal_m} m</strong>
              </span>
            )}
            {normativa?.aislamiento_lateral_m != null && (
              <span>
                Lateral: <strong>{normativa.aislamiento_lateral_m} m</strong>
              </span>
            )}
            {normativa?.aislamiento_posterior_m != null && (
              <span>
                Posterior: <strong>{normativa.aislamiento_posterior_m} m</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {arq.observaciones && (
        <div className="border-t pt-3 mt-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Notas del análisis
          </p>
          <p className="text-sm whitespace-pre-wrap">{arq.observaciones}</p>
        </div>
      )}
    </Card>
  );
};

const BloqueAnalisisPorArea = ({
  scoresIndividuales,
  hallazgosCriticos,
}: {
  scoresIndividuales: Record<CodigoAnalisis, number | null>;
  hallazgosCriticos: HallazgoArea[];
}) => (
  <Card className="p-6">
    <div className="flex items-center gap-2 mb-3">
      <Target className="h-5 w-5 text-primary" />
      <h2 className="font-display text-lg font-semibold">Análisis técnico por área</h2>
    </div>
    <p className="text-sm text-muted-foreground mb-4">
      Resumen visual de los 8 análisis técnicos realizados por 360Lateral.
    </p>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ANALISIS_AREAS.map((area) => (
        <AnalisisAreaCard
          key={area.codigo}
          area={area}
          score={scoresIndividuales[area.codigo]}
          hallazgos={hallazgosCriticos.filter((h) => h.area === area.codigo)}
        />
      ))}
    </div>
  </Card>
);

const BloqueFinancieroMercado = ({
  fin,
  mkt,
}: {
  fin: FinancieroLote | null;
  mkt: MercadoLote | null;
}) => (
  <Card className="p-6">
    <div className="flex items-center gap-2 mb-4">
      <DollarSign className="h-5 w-5 text-primary" />
      <h2 className="font-display text-lg font-semibold">Financiero y mercado</h2>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 mb-4">
      <KPIFinancieroCard
        label="Valor de compra estimado"
        value={fin?.valor_compra_lote}
        format="cop"
        icon={Wallet}
      />
      <KPIFinancieroCard
        label="Valor m² zona"
        value={mkt?.precio_venta_m2_zona}
        format="cop"
        suffix="/m²"
        icon={Building}
      />
      <KPIFinancieroCard
        label="Punto de equilibrio"
        value={fin?.punto_equilibrio_pct}
        format="percentage"
        descripcion="% unidades a vender"
        icon={Activity}
      />
      <KPIFinancieroCard
        label="TIR proyectada"
        value={fin?.tir_pct}
        format="percentage"
        descripcion="Tasa interna de retorno"
        icon={TrendingUp}
        destacado
      />
      <KPIFinancieroCard
        label="VPN"
        value={fin?.vpn}
        format="cop"
        descripcion="Valor presente neto"
        icon={Calculator}
        destacado
      />
      <KPIFinancieroCard
        label="Margen bruto"
        value={fin?.margen_bruto_pct}
        format="percentage"
        icon={Briefcase}
      />
    </div>

    {mkt && (
      <div className="border-t pt-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Insights de mercado
        </p>
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          {mkt.proyectos_competidores != null && (
            <div>
              <span className="text-muted-foreground">Proyectos competidores:</span>{" "}
              <strong>{mkt.proyectos_competidores}</strong>
            </div>
          )}
          {mkt.velocidad_absorcion_unidades_mes != null && (
            <div>
              <span className="text-muted-foreground">Absorción:</span>{" "}
              <strong>{mkt.velocidad_absorcion_unidades_mes} und/mes</strong>
            </div>
          )}
          {mkt.valorizacion_anual_pct != null && (
            <div>
              <span className="text-muted-foreground">Valorización anual:</span>{" "}
              <Badge variant="secondary" className="ml-1">
                {fmtPct(mkt.valorizacion_anual_pct)}
              </Badge>
            </div>
          )}
        </div>
      </div>
    )}

    {(fin?.observaciones || mkt?.observaciones) && (
      <div className="border-t pt-3 mt-3 space-y-2">
        {fin?.observaciones && (
          <p className="text-xs">
            <span className="text-muted-foreground uppercase tracking-wide font-medium">
              Notas financieras:
            </span>{" "}
            <span>{fin.observaciones}</span>
          </p>
        )}
        {mkt?.observaciones && (
          <p className="text-xs">
            <span className="text-muted-foreground uppercase tracking-wide font-medium">
              Notas de mercado:
            </span>{" "}
            <span>{mkt.observaciones}</span>
          </p>
        )}
      </div>
    )}
  </Card>
);

const BloquePerfilComprador = ({ perfiles }: { perfiles: PerfilCompradorIdeal[] }) => (
  <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
    <div className="flex items-center gap-2 mb-3">
      <Users className="h-5 w-5 text-primary" />
      <h2 className="font-display text-lg font-semibold">¿Para quién es ideal este lote?</h2>
    </div>
    <div className="space-y-3">
      {perfiles.map((perfil, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 bg-background/60 rounded-md">
          <perfil.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{perfil.titulo}</p>
            <p className="text-xs text-muted-foreground mt-1">{perfil.razon}</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// ---------- Wrapper exportado ----------

interface FichaBloquesExtraProps {
  ficha: FichaEnriquecidaData;
  areaTotalM2: number | null;
}

export const FichaBloquesExtra = ({ ficha, areaTotalM2 }: FichaBloquesExtraProps) => {
  const tieneAlgunScore = Object.values(ficha.scoresIndividuales).some((v) => v != null);
  const tieneFinanciero = !!ficha.financiero;
  const tieneMercado = !!ficha.mercado;

  const perfiles = derivarPerfilesCompradorIdeal({
    areaTotalM2,
    scorePromedio: ficha.scorePromedio,
    scoreNormativo: ficha.scoresIndividuales.normativo,
    normativa: ficha.normativa,
    arquitectonico: ficha.arquitectonico,
    financiero: ficha.financiero,
    mercado: ficha.mercado,
  });

  return (
    <div className="space-y-6 mb-8">
      {ficha.arquitectonico && (
        <BloqueAprovechamiento arq={ficha.arquitectonico} normativa={ficha.normativa} />
      )}
      {tieneAlgunScore && (
        <BloqueAnalisisPorArea
          scoresIndividuales={ficha.scoresIndividuales}
          hallazgosCriticos={ficha.hallazgosCriticos}
        />
      )}
      {(tieneFinanciero || tieneMercado) && (
        <BloqueFinancieroMercado fin={ficha.financiero} mkt={ficha.mercado} />
      )}
      {(ficha.arquitectonico || ficha.financiero || ficha.mercado) && (
        <BloquePerfilComprador perfiles={perfiles} />
      )}
    </div>
  );
};

export default FichaBloquesExtra;
