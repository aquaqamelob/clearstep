import type { Decision, ScenarioMeta } from "./types";

export type Facts = Record<string, string | number | boolean>;

/**
 * Deterministic decision engine. Pure function. No I/O, no LLM.
 * Maps collected facts to one of the scenario's pre-defined Decision objects.
 *
 * Each scenario gets a hand-written branching rule. We deliberately KEEP this
 * in TypeScript (not a JSON expression evaluator) so:
 *   - the rule is reviewable in code review
 *   - the rule has full type safety
 *   - no JSON-eval injection surface
 */
export function decide(scenario: ScenarioMeta, facts: Facts): Decision {
  const decisions = Object.fromEntries(scenario.decisions.map((d) => [d.id, d]));

  switch (scenario.id) {
    case "PREGNANCY_SCARE":
      return decidePregnancyScare(facts, decisions);
    case "MENTAL_HEALTH":
      return decideMentalHealth(facts, decisions);
    default:
      // Fallback to the last decision in the list (designed to be the safest "general consult" option).
      return scenario.decisions[scenario.decisions.length - 1];
  }
}

function pick<T extends string>(decisions: Record<string, Decision>, id: T): Decision {
  const d = decisions[id];
  if (!d) {
    throw new Error(`decide(): unknown decision id "${id}"`);
  }
  return d;
}

function decidePregnancyScare(facts: Facts, decisions: Record<string, Decision>): Decision {
  const time = String(facts.time_since_upsi ?? "").toLowerCase();
  const contraception = String(facts.contraception_used ?? "").toLowerCase();

  if (contraception.includes("żadna") || contraception.includes("pękła") || contraception.includes("pominięta") || contraception.includes("inna")) {
    if (time.includes("<12") || time.includes("12-72")) return pick(decisions, "EC_WINDOW_TIGHT");
    if (time.includes("72-120")) return pick(decisions, "EC_WINDOW_LATE");
    if (time.includes(">120")) return pick(decisions, "TEST_WINDOW");
    if (time.includes("nie pamiętam")) return pick(decisions, "EC_WINDOW_LATE");
  }

  return pick(decisions, "GENERAL_CONSULT");
}

function decideMentalHealth(facts: Facts, decisions: Record<string, Decision>): Decision {
  const ideation = String(facts.suicidal_ideation ?? "").toLowerCase();
  const duration = String(facts.duration ?? "").toLowerCase();
  const impact = String(facts.functional_impact ?? "").toLowerCase();

  // Active suicidal ideation should already have been escalated to EmergencyCard
  // by the API route before we ever get here. This is a safety net.
  if (ideation.includes("aktywne") || ideation.includes("plan")) {
    return pick(decisions, "MH_PSYCHIATRIST");
  }

  const longDuration = duration.includes("ponad miesiąc") || duration.includes("6 miesięcy");
  const heavyImpact = impact.includes("opuszczam") || impact.includes("nie wstaję");
  if (longDuration || heavyImpact) return pick(decisions, "MH_PSYCHIATRIST");

  const moderateDuration = duration.includes("1-2 tygodnie") || duration.includes("2-4 tygodnie");
  const moderateImpact = impact.includes("trudno mi się skupić");
  if (moderateDuration || moderateImpact) return pick(decisions, "MH_THERAPY_PRIVATE");

  return pick(decisions, "MH_LIGHT_SUPPORT");
}
