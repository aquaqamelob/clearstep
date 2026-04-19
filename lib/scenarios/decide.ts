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
    case "TRIAGE_URTI":
      return decideUrti(facts, decisions);
    case "TRIAGE_GASTRO":
      return decideGastro(facts, decisions);
    case "TRIAGE_CHEST":
      return decideChest(facts, decisions);
    case "TRIAGE_HEADACHE":
      return decideHeadache(facts, decisions);
    case "TRIAGE_ANKLE":
      return decideAnkle(facts, decisions);
    default:
      // Fallback to the last decision in the list (designed to be the safest "general consult" option).
      return scenario.decisions[scenario.decisions.length - 1];
  }
}

// Tolerant-equality helper: case-insensitive substring match. Lets us write
// rules without copy-pasting full Polish option strings (with diacritics and
// dashes) verbatim.
function has(facts: Facts, key: string, ...needles: string[]): boolean {
  const v = String(facts[key] ?? "").toLowerCase();
  return needles.some((n) => v.includes(n.toLowerCase()));
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

function decideUrti(facts: Facts, decisions: Record<string, Decision>): Decision {
  if (
    has(facts, "fluent_full_sentences", "nie") ||
    has(facts, "lower_airway_red_flags", "tak") ||
    has(facts, "fever_level", "bardzo wysoka", "nie spada")
  ) {
    return pick(decisions, "URTI_EMERGENCY_CARE");
  }
  if (has(facts, "symptom_days", "ponad 7") || has(facts, "fever_level", "39")) {
    return pick(decisions, "URTI_POZ_SOON");
  }
  return pick(decisions, "URTI_SELF_CARE");
}

function decideGastro(facts: Facts, decisions: Record<string, Decision>): Decision {
  if (
    has(facts, "pain_pattern", "stały", "stale", "jednym miejscu") ||
    has(facts, "abdomen_soft_no_rebound", "twardy", "skok bólu", "skok bolu") ||
    has(facts, "gi_bleeding_signs", "tak", "podejrzewam")
  ) {
    return pick(decisions, "GASTRO_EMERGENCY");
  }
  return pick(decisions, "GASTRO_HOME_ORAL_REHYDRATION");
}

function decideChest(facts: Facts, decisions: Record<string, Decision>): Decision {
  if (has(facts, "ischemic_like_pain", "tak, tak", "tak to wygląda", "tak to wyglada")) {
    return pick(decisions, "CHEST_EMERGENCY_CARDIAC_WORKUP");
  }
  if (
    has(facts, "age_band", "powyżej 50", "powyzej 50") &&
    has(facts, "ischemic_like_pain", "nie potrafię", "nie potrafie")
  ) {
    return pick(decisions, "CHEST_UNCERTAIN_POZ");
  }
  if (
    has(facts, "pain_worse_palpation_or_move", "tak") ||
    has(facts, "hyperventilation_signs", "tak")
  ) {
    return pick(decisions, "CHEST_PANIC_PATTERN");
  }
  return pick(decisions, "CHEST_UNCERTAIN_POZ");
}

function decideHeadache(facts: Facts, decisions: Record<string, Decision>): Decision {
  if (
    has(facts, "onset_speed", "sekundach", "uderzenie pioruna") ||
    has(facts, "projectile_morning_vomit", "tak") ||
    has(facts, "valsalva_big_worse", "tak") ||
    has(facts, "fever_stiff_neck_focal_neuro", "tak", "podejrzewam")
  ) {
    return pick(decisions, "HEADACHE_EMERGENCY");
  }
  return pick(decisions, "HEADACHE_TENSION_SELF_CARE");
}

function decideAnkle(facts: Facts, decisions: Record<string, Decision>): Decision {
  if (
    has(facts, "open_wound_or_gross_deformity", "tak", "podejrzewam") ||
    has(facts, "circulation_ok", "niepewnie")
  ) {
    return pick(decisions, "ANKLE_EMERGENCY");
  }
  if (
    has(facts, "can_take_four_steps", "nie – nie dało się stanąć", "nie - nie dalo", "nie dalo sie stanac") ||
    has(facts, "malleolar_bone_tenderness", "tak", "bardzo bolesny")
  ) {
    return pick(decisions, "ANKLE_IMAGING_POZ");
  }
  return pick(decisions, "ANKLE_PRICE_HOME");
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
