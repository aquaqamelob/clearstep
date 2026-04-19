import type { Powiat, ScenarioId } from "./types";

/**
 * Pure functions that derive ranking/heatmap metrics from raw powiat data.
 * Kept separate from the JSON loader so they can be unit-tested in isolation
 * and so the JSON shape stays minimal (only the things sales analysts can
 * audit by hand).
 */

/**
 * Demand-supply gap. Higher = more underserved.
 *
 * `queries / max(clinics, 1)` is the raw demand-per-clinic ratio. We then
 * compress with sqrt + normalize against the dataset max so the heatmap
 * doesn't get one outlier (e.g. Lubaczowski with 0 clinics) that washes
 * everything else into the "blue" bucket. Returns a 0..1 score.
 */
export function gapScore(p: Powiat): number {
  const denom = Math.max(p.existingClinics, 1);
  return Math.sqrt(p.queries30d / denom) / 60;
}

/** 0..1 normalized growth (clipped at 100% MoM). */
export function growthScore(p: Powiat): number {
  return Math.min(1, p.growthMoM);
}

/** 0..1 share of the dominant scenario in the powiat (used for heatmap). */
export function scenarioShare(p: Powiat, scenario: ScenarioId): number {
  return p.scenarioMix[scenario] ?? 0;
}

export type HeatmapMode = "demandSupply" | "growth" | "scenarioMix";

export type CellMetric = {
  value: number; // raw value driving color (0..1 normalized for color stop)
  label: string; // tooltip number — formatted ("× 1.34", "+42%", "34%")
  rawLabel: string; // contextual subtitle for tooltip ("418 zapytań / 1 klinika")
};

export function metricFor(
  p: Powiat,
  mode: HeatmapMode,
  scenario: ScenarioId = "MENTAL_HEALTH"
): CellMetric {
  switch (mode) {
    case "demandSupply": {
      const v = gapScore(p);
      const ratio = p.queries30d / Math.max(p.existingClinics, 1);
      return {
        value: v,
        label: `${ratio.toFixed(0)} / klinika`,
        rawLabel: `${p.queries30d.toLocaleString("pl-PL")} zapyt. · ${p.existingClinics} klinik`,
      };
    }
    case "growth": {
      return {
        value: growthScore(p),
        label: `${(p.growthMoM * 100).toFixed(0)}% m/m`,
        rawLabel: `${p.queries30d.toLocaleString("pl-PL")} zapyt. (30d)`,
      };
    }
    case "scenarioMix": {
      const s = scenarioShare(p, scenario);
      return {
        value: s,
        label: `${(s * 100).toFixed(0)}% udziału`,
        rawLabel: scenarioLabelPL(scenario),
      };
    }
  }
}

export function scenarioLabelPL(s: ScenarioId): string {
  switch (s) {
    case "PREGNANCY_SCARE":
      return "Pregnancy scare";
    case "MENTAL_HEALTH":
      return "Mental health";
    case "TRIAGE_URTI":
      return "Infekcje (URTI)";
    case "TRIAGE_GASTRO":
      return "Gastro";
    case "TRIAGE_CHEST":
      return "Klatka piersiowa";
    case "TRIAGE_HEADACHE":
      return "Ból głowy";
    case "TRIAGE_ANKLE":
      return "Urazy kostki";
  }
}
