"use client";

import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  metricFor,
  scenarioLabelPL,
  type CellMetric,
  type HeatmapMode,
} from "@/lib/b2b/derived";
import type { B2BData, Powiat, ScenarioId } from "@/lib/b2b/types";

import geojsonRaw from "@/data/b2b/podkarpacie-powiaty.json";

const SCENARIOS: ScenarioId[] = [
  "MENTAL_HEALTH",
  "PREGNANCY_SCARE",
  "TRIAGE_URTI",
  "TRIAGE_GASTRO",
  "TRIAGE_CHEST",
  "TRIAGE_HEADACHE",
  "TRIAGE_ANKLE",
];

const MODE_LABELS: Record<HeatmapMode, { title: string; desc: string }> = {
  demandSupply: {
    title: "Demand vs supply gap",
    desc: "Ile zapytań przypada na 1 istniejącą klinikę. Ciemniejszy kolor = większy niedobór podaży.",
  },
  growth: {
    title: "Wzrost m/m",
    desc: "Procentowa zmiana liczby zapytań względem poprzedniego okna 30 dni. Ciemniejszy kolor = szybszy wzrost.",
  },
  scenarioMix: {
    title: "Mix scenariuszy",
    desc: "Udział wybranego scenariusza w całości zapytań regionu. Pokazuje, gdzie który problem dominuje.",
  },
};

/* ── Map geometry ──────────────────────────────────────────────────────────
 * GeoJSON of the 25 Podkarpackie powiats lives in `data/b2b/...json`. Each
 * feature carries `properties.id` matching `Powiat.id` in the metrics JSON,
 * so the join is a single Map lookup.
 *
 * We project once at render-time using d3-geo: `geoMercator().fitSize(...)`
 * scales/centers all polygons into the SVG viewBox. Mercator is fine for a
 * region this small (~150 km tall) — distortion is invisible. Path strings
 * are derived once per (data, viewBox) pair and memoized.
 */
type MapFeature = {
  type: "Feature";
  properties: { id: string; nazwa: string };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};
type MapFC = { type: "FeatureCollection"; features: MapFeature[] };

const FEATURES = (geojsonRaw as unknown as MapFC).features;

const VIEW_W = 720;
const VIEW_H = 540;

/** Cool→hot color ramp in HSL: pale blue → saturated orange. Same scale as
 * before so the legend gradient still matches. */
function colorFor(v: number): string {
  const clamped = Math.max(0, Math.min(1, v));
  const h = 220 - clamped * 190;
  const s = 25 + clamped * 55;
  const l = 92 - clamped * 32;
  return `hsl(${h.toFixed(0)}deg ${s.toFixed(0)}% ${l.toFixed(0)}%)`;
}

type Hover = {
  powiat: Powiat;
  metric: CellMetric;
  x: number;
  y: number;
} | null;

export function PodkarpacieMap({ data }: { data: B2BData }) {
  const [mode, setMode] = useState<HeatmapMode>("demandSupply");
  const [scenario, setScenario] = useState<ScenarioId>("MENTAL_HEALTH");
  const [selected, setSelected] = useState<Powiat | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Powiat lookup by id
  const byId = useMemo(() => {
    const m = new Map<string, Powiat>();
    for (const p of data.powiats) m.set(p.id, p);
    return m;
  }, [data.powiats]);

  // Project once. fitSize centers + scales the whole feature collection into
  // the viewBox with a small inset so border strokes don't get clipped.
  const { paths, centroids } = useMemo(() => {
    const projection = geoMercator().fitSize(
      [VIEW_W - 16, VIEW_H - 16],
      { type: "FeatureCollection", features: FEATURES } as GeoPermissibleObjects
    );
    const path = geoPath(projection);
    const paths: { id: string; d: string }[] = [];
    const centroids: Record<string, [number, number]> = {};
    for (const f of FEATURES) {
      const d = path(f as GeoPermissibleObjects);
      if (!d) continue;
      paths.push({ id: f.properties.id, d });
      const c = path.centroid(f as GeoPermissibleObjects);
      // Offset by the inset so the centroid aligns with the path
      centroids[f.properties.id] = [c[0] + 8, c[1] + 8];
    }
    return { paths, centroids };
  }, []);

  // Compute metric for every powiat under current mode (so we can normalize
  // the color ramp to the dataset max — otherwise demandSupply compresses).
  const metrics = useMemo(() => {
    const out = new Map<string, CellMetric>();
    for (const p of data.powiats) out.set(p.id, metricFor(p, mode, scenario));
    return out;
  }, [data.powiats, mode, scenario]);

  const maxValue = Math.max(0.0001, ...Array.from(metrics.values(), (m) => m.value));

  return (
    <Card className="@container/heatmap">
      <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span>Heatmapa: {MODE_LABELS[mode].title}</span>
            <Badge variant="secondary">25 powiatów</Badge>
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl">
            {MODE_LABELS[mode].desc}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as HeatmapMode)}>
            <TabsList>
              <TabsTrigger value="demandSupply">Gap</TabsTrigger>
              <TabsTrigger value="growth">Wzrost</TabsTrigger>
              <TabsTrigger value="scenarioMix">Mix</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "scenarioMix" && (
            <Select
              value={scenario}
              onValueChange={(v) => setScenario(v as ScenarioId)}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {scenarioLabelPL(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 @4xl/heatmap:grid-cols-[1fr_260px]">
          <div>
            {/* The map */}
            <div className="relative">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="w-full h-auto rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50/40 ring-1 ring-black/5"
                role="img"
                aria-label="Mapa popytu - powiaty wojewodztwa podkarpackiego"
                onMouseLeave={() => setHover(null)}
              >
                {/* Polygons */}
                <g transform="translate(8 8)">
                  {paths.map(({ id, d }) => {
                    const p = byId.get(id);
                    if (!p) return null;
                    const m = metrics.get(id)!;
                    const v = m.value / maxValue;
                    const isSelected = selected?.id === id;
                    const isLuxmed = p.luxmedClinics > 0;
                    const isCity = p.type === "grodzki";
                    return (
                      <path
                        key={id}
                        d={d}
                        fill={colorFor(v)}
                        stroke={
                          isSelected
                            ? "var(--foreground)"
                            : isCity
                              ? "rgba(15,23,42,0.45)"
                              : "rgba(15,23,42,0.18)"
                        }
                        strokeWidth={isSelected ? 2.5 : isCity ? 1.2 : 0.7}
                        className="cursor-pointer transition-[fill,stroke,opacity] duration-150 hover:opacity-90"
                        onMouseMove={(e) => {
                          const svg = svgRef.current;
                          if (!svg) return;
                          const rect = svg.getBoundingClientRect();
                          setHover({
                            powiat: p,
                            metric: m,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }}
                        onClick={() =>
                          setSelected((curr) =>
                            curr?.id === id ? null : p
                          )
                        }
                      >
                        <title>{`${p.name} — ${m.label}`}</title>
                      </path>
                    );
                  })}
                </g>

                {/* Labels for major cities (grodzkie) + Luxmed dots */}
                <g
                  transform="translate(0 0)"
                  className="pointer-events-none"
                  fontFamily="var(--font-sans)"
                >
                  {paths.map(({ id }) => {
                    const p = byId.get(id);
                    if (!p) return null;
                    const c = centroids[id];
                    if (!c) return null;
                    const isCity = p.type === "grodzki";
                    const isLuxmed = p.luxmedClinics > 0;
                    return (
                      <g key={`label-${id}`} transform={`translate(${c[0]} ${c[1]})`}>
                        {isLuxmed && (
                          <circle
                            r={3}
                            cx={0}
                            cy={isCity ? -10 : 0}
                            fill="var(--primary)"
                            stroke="white"
                            strokeWidth={1.5}
                          />
                        )}
                        {isCity && (
                          <text
                            y={4}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={600}
                            fill="rgb(15,23,42)"
                            stroke="white"
                            strokeWidth={3}
                            paintOrder="stroke"
                          >
                            {p.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Floating tooltip */}
              {hover && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
                  style={{
                    left: Math.min(hover.x + 12, VIEW_W - 200),
                    top: Math.max(hover.y - 56, 8),
                  }}
                >
                  <p className="font-semibold text-foreground">
                    {hover.powiat.name}
                  </p>
                  <p className="text-foreground/80 tabular-nums">
                    {hover.metric.label}
                  </p>
                  <p className="text-muted-foreground text-[10px]">
                    {hover.metric.rawLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>niski</span>
                <div
                  className="h-2 w-32 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, hsl(220 25% 92%) 0%, hsl(125 50% 76%) 50%, hsl(30 80% 60%) 100%)",
                  }}
                />
                <span>wysoki</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                <span>klinika Luxmed obecna</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-sm border"
                  style={{ borderColor: "rgba(15,23,42,0.45)" }}
                />
                <span>miasto na prawach powiatu</span>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            {selected ? (
              <PowiatDetail powiat={selected} />
            ) : (
              <div className="flex h-full flex-col items-start justify-center gap-2 text-muted-foreground">
                <p className="font-medium text-foreground">
                  Kliknij powiat na mapie
                </p>
                <p className="text-xs">
                  Pokażemy populację, mix scenariuszy, podaż klinik i
                  rekomendację: <em>czy stawiać tu placówkę</em>.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PowiatDetail({ powiat: p }: { powiat: Powiat }) {
  const ratio = p.queries30d / Math.max(p.existingClinics, 1);
  const recommendation = recommendationFor(p);
  const sortedMix = (Object.entries(p.scenarioMix) as [ScenarioId, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight">
            {p.name}
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {p.type === "grodzki" ? "miasto" : "powiat"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {p.population.toLocaleString("pl-PL")} mieszkańców
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Zapytania 30d" value={p.queries30d.toLocaleString("pl-PL")} />
        <Stat label="Wzrost m/m" value={`+${(p.growthMoM * 100).toFixed(0)}%`} />
        <Stat label="Kliniki priv." value={String(p.existingClinics)} />
        <Stat
          label="Q / klinika"
          value={ratio.toFixed(0)}
          tone={ratio > 250 ? "warn" : "neutral"}
        />
      </div>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
          Top scenariusze
        </p>
        <div className="space-y-1">
          {sortedMix.map(([s, share]) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate text-foreground/80">
                {scenarioLabelPL(s)}
              </span>
              <div className="h-1.5 w-16 rounded-full bg-foreground/5">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${share * 100}%` }}
                />
              </div>
              <span className="tabular-nums text-muted-foreground w-9 text-right">
                {(share * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`rounded-lg p-2.5 text-xs leading-snug ${
          recommendation.tier === "high"
            ? "bg-success/10 text-success-foreground border border-success/30"
            : recommendation.tier === "med"
              ? "bg-warning/10 text-warning-foreground border border-warning/30"
              : "bg-foreground/5 text-foreground/70"
        }`}
      >
        <p className="font-medium mb-0.5">{recommendation.title}</p>
        <p className="opacity-80">{recommendation.body}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <div className="rounded-md border bg-background/60 px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-sm font-semibold tabular-nums ${
          tone === "warn" ? "text-warning" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function recommendationFor(p: Powiat): {
  tier: "high" | "med" | "low";
  title: string;
  body: string;
} {
  const ratio = p.queries30d / Math.max(p.existingClinics, 1);
  const highDemand = ratio > 250;
  const fastGrowth = p.growthMoM > 0.4;
  const noLuxmed = p.luxmedClinics === 0;

  if (highDemand && noLuxmed && fastGrowth) {
    return {
      tier: "high",
      title: "Mocna rekomendacja: postaw placówkę.",
      body: `${ratio.toFixed(0)} zapytań na klinikę, +${(p.growthMoM * 100).toFixed(0)}% m/m i 0 punktów Luxmed. Pierwszy mover capture market.`,
    };
  }
  if ((highDemand && noLuxmed) || (fastGrowth && noLuxmed)) {
    return {
      tier: "med",
      title: "Warto rozważyć: telemedycyna lub partnerstwo.",
      body: `Niedobór podaży lub szybki wzrost. Test minimum-viable: rozszerz dostępność teleporad zanim postawisz fizyczny punkt.`,
    };
  }
  if (p.luxmedClinics > 0) {
    return {
      tier: "low",
      title: "Już obecni: optymalizuj wykorzystanie.",
      body: `${p.luxmedClinics} placówka(i) Luxmed. Skupić się na cross-sell scenariuszy zdrowia psychicznego (top w regionie).`,
    };
  }
  return {
    tier: "low",
    title: "Niski priorytet.",
    body: `Stosunek popytu do podaży nie uzasadnia ekspansji w tym kwartale.`,
  };
}
