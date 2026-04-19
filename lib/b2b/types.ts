/**
 * Typed shape of `data/b2b/podkarpacie.json`.
 *
 * Single-region B2B sales artifact for Luxmed/Medicover/Enel-Med pitches:
 * "show me where to put the next clinic". Source-of-truth metric is
 * `gapScore` (computed in `lib/b2b/derived.ts`), but every powiat is also
 * shipped with raw counts so analysts can audit the math.
 */

export type ScenarioId =
  | "PREGNANCY_SCARE"
  | "MENTAL_HEALTH"
  | "TRIAGE_URTI"
  | "TRIAGE_GASTRO"
  | "TRIAGE_CHEST"
  | "TRIAGE_HEADACHE"
  | "TRIAGE_ANKLE";

export type Powiat = {
  id: string;
  name: string;
  type: "ziemski" | "grodzki";
  /**
   * Legacy schematic grid coordinates (kept in JSON for back-compat with the
   * previous dashboard prototype). The current map uses real GeoJSON polygons
   * from `podkarpacie-powiaty.json` and ignores these. Safe to drop later.
   */
  col?: number;
  row?: number;
  population: number;
  queries30d: number;
  /** Month-over-month growth as a decimal (0.42 = +42%). */
  growthMoM: number;
  /** All private clinics offering POZ + telemedicine in the powiat. */
  existingClinics: number;
  /** Subset of `existingClinics` that are Luxmed-branded. */
  luxmedClinics: number;
  topScenario: ScenarioId;
  scenarioMix: Record<ScenarioId, number>;
};

export type RegionTrendPoint = {
  date: string;
  queries: number;
  mentalHealth: number;
  pregnancy: number;
  triage: number;
};

export type B2BData = {
  region: string;
  asOf: string;
  totals: {
    queries30d: number;
    queriesPrev30d: number;
    uniqueUsers30d: number;
    existingPrivateClinics: number;
    luxmedFootprint: number;
    scenarios: Record<ScenarioId, number>;
  };
  trend30d: RegionTrendPoint[];
  powiats: Powiat[];
};
