import { ScenarioMetaSchema, type ScenarioMeta } from "./types";

import pregnancyScareRaw from "@/data/scenarios/pregnancy-scare.json";
import mentalHealthRaw from "@/data/scenarios/mental-health.json";
import urtiRaw from "@/data/scenarios/urti.json";
import gastroRaw from "@/data/scenarios/gastro.json";
import chestRaw from "@/data/scenarios/chest.json";
import headacheRaw from "@/data/scenarios/headache.json";
import ankleRaw from "@/data/scenarios/ankle.json";

const RAW: Record<string, unknown> = {
  PREGNANCY_SCARE: pregnancyScareRaw,
  MENTAL_HEALTH: mentalHealthRaw,
  TRIAGE_URTI: urtiRaw,
  TRIAGE_GASTRO: gastroRaw,
  TRIAGE_CHEST: chestRaw,
  TRIAGE_HEADACHE: headacheRaw,
  TRIAGE_ANKLE: ankleRaw,
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
  TRIAGE_URTI: ScenarioMeta;
  TRIAGE_GASTRO: ScenarioMeta;
  TRIAGE_CHEST: ScenarioMeta;
  TRIAGE_HEADACHE: ScenarioMeta;
  TRIAGE_ANKLE: ScenarioMeta;
}>;

export function getScenario(id: string): ScenarioMeta | null {
  return (validated[id] as ScenarioMeta | undefined) ?? null;
}

export function listScenarios(): ScenarioMeta[] {
  return Object.values(validated);
}
