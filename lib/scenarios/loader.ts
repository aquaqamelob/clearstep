import { ScenarioMetaSchema, type ScenarioMeta } from "./types";

import pregnancyScareRaw from "@/data/scenarios/pregnancy-scare.json";
import mentalHealthRaw from "@/data/scenarios/mental-health.json";

const RAW: Record<string, unknown> = {
  PREGNANCY_SCARE: pregnancyScareRaw,
  MENTAL_HEALTH: mentalHealthRaw,
};

const validated: Record<string, ScenarioMeta> = {};
for (const [key, raw] of Object.entries(RAW)) {
  const parsed = ScenarioMetaSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Scenario "${key}" failed schema validation:\n${JSON.stringify(parsed.error.format(), null, 2)}`
    );
  }
  validated[key] = parsed.data;
}

export const SCENARIOS = validated as Readonly<{
  PREGNANCY_SCARE: ScenarioMeta;
  MENTAL_HEALTH: ScenarioMeta;
}>;

export function getScenario(id: string): ScenarioMeta | null {
  return (validated[id] as ScenarioMeta | undefined) ?? null;
}

export function listScenarios(): ScenarioMeta[] {
  return Object.values(validated);
}
