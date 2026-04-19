/**
 * Deterministic intent pre-classifier for Polish colloquialisms.
 *
 * Runs BEFORE the LLM call. High-confidence keyword matches short-circuit the
 * LLM entirely — saves a roundtrip, avoids hallucinations on ambiguous slang
 * like "pekła guma" (which the LLM tends to misroute to STD_PANIC even though
 * the time-sensitive concern is the 72h pregnancy window).
 *
 * Returns null when nothing matches → caller falls back to LLM classification.
 */

export type IntentLabel =
  | "PREGNANCY_SCARE"
  | "MENTAL_HEALTH"
  | "STD_PANIC"
  | "GENERAL_SICK"
  | "TRIAGE_URTI"
  | "TRIAGE_GASTRO"
  | "TRIAGE_CHEST"
  | "TRIAGE_HEADACHE"
  | "TRIAGE_ANKLE"
  | "EMERGENCY";

type Rule = {
  intent: IntentLabel;
  /** Higher = wins ties when multiple rules match. */
  priority: number;
  patterns: RegExp[];
};

// Rules are intentionally TIME-SENSITIVE-FIRST. When two intents both match,
// the higher priority wins. Pregnancy scare (72h emergency contraception window)
// outranks STD panic (days-to-weeks window) outranks generic sick.
const RULES: Rule[] = [
  {
    intent: "PREGNANCY_SCARE",
    priority: 100,
    patterns: [
      // Broken / failed condom — Polish phrasings, typos, and intervening
      // pronouns ("nam", "mi", "się"). Allow up to 20 non-terminal chars
      // between the verb and the condom noun so "pękła nam prezerwatywa"
      // and "guma się zerwała" both hit. Use [lł]? to match the typo "pekla"
      // (no Polish chars) just as well as "pękła".
      /p[eę]k[lł]?[aoą]?\b[^.!?\n]{0,20}?\b(guma|gumka|prezerwatyw|kondom)/i,
      /zerw[aą]ł?[aoą]?\b[^.!?\n]{0,20}?\b(guma|gumka|prezerwatyw|kondom)/i,
      /(guma|gumka|prezerwatyw|kondom)\b[^.!?\n]{0,20}?\bp[eę]k[lł]/i,
      /(guma|gumka|prezerwatyw|kondom)\b[^.!?\n]{0,20}?\bzerw/i,
      /zsun[eę]ł?[aoą]?\b[^.!?\n]{0,20}?\b(guma|gumka|prezerwatyw|kondom)/i,
      /(guma|gumka|prezerwatyw|kondom)\b[^.!?\n]{0,20}?\bspad[lł]/i,
      /uszkodz\w*\s*(guma|gumka|prezerwatyw|kondom)/i,

      // Unprotected / no protection / he came inside
      /bez\s*(zabezpieczeni|prezerwatyw|gumy|gumki|kondom|antykoncepcj)/i,
      /nie\s*by[lł]o\s*(zabezpieczeni|prezerwatyw|gumy|gumki)/i,
      /sko[nń]?czy[lł]\s*(w|do)\s*(środk|mnie)/i,
      /sko[nń]?czy[lł]\s*we\s*mnie/i,
      /spuści[lł]\s*(si[eę]\s*)?(w|do)\s*(środk|mnie)/i,

      // Slipped pill / missed birth control
      /(zapomn|opuszcz)\w*\s*(tabletk|pigułk)/i,
      /tabletk\w*\s*(zapomn|opuszcz|nie\s*wzi)/i,

      // Direct asks for emergency contraception
      /tabletk\w*\s*(po|dzie[nń]\s*po|antykoncepcj)/i,
      /ellaone|escapelle|po-?72|day.?after.?pill|morning.?after/i,
      /antykoncepcj\w*\s*awaryjn/i,

      // Pregnancy fear / late period — allow intervening pronouns
      /(boj|obawiam|martwi[eę])\s*si[eę]\b[^.!?\n]{0,15}?\bci[ąa][zż]/i,
      /(sp[oó][zź]nia|op[oó][zź]nia)\b[^.!?\n]{0,15}?\b(okres|miesi[ąa]czk)/i,
      /(brak|op[oó][zź]nieni)\w*\s*(okresu|miesi[ąa]czki)/i,
      /(mog[eę]|mog[lł]aby|chyba\s*jestem|jestem)\s*w\s*ci[ąa][zż]y/i,

      // Catch-all slang shortcuts
      /\bwpadk[ai]\b/i,
    ],
  },

  {
    intent: "MENTAL_HEALTH",
    priority: 80,
    patterns: [
      /(bezsenno|nie\s*mog[eę]\s*spa[cć]|nie\s*śpi[eę]|nie\s*sypiam)/i,
      /(depresj|przygn[eę]bi|smutn|brak\s*sił|brak\s*motywacj)/i,
      /(l[eę]k|panik|atak\s*panik|niepok[oó]j)/i,
      /(nic\s*mnie\s*nie\s*cieszy|anhedoni|wypaleni|burnout)/i,
      /(stresuj|zestresowan|zm[eę]czon|przem[eę]czon)/i,
      /(p[lł]acz[eę]|płaczliw)/i,
    ],
  },

  {
    intent: "STD_PANIC",
    priority: 60,
    patterns: [
      /(STD|STI|HIV|chlamydi|rze[zż]ączk|kiła|syfilis|opryszczk|HPV|wenery)/i,
      /(pieczeni|świąd|wydzielin|upławy|wysypk|pryszcz)\s*(na|w)\s*(penis|pochw|sromie|krocz)/i,
      /(dziwn|nietypow|niepokoj)\w*\s*(wydzielin|upław|zapach|świąd)/i,
      /(podejrzew|boj[eę])\s*si[eę]\s*(STD|STI|HIV|chlamydi|kił|wenery)/i,
      /(test|badanie)\s*(na|w\s*kierunku)\s*(STD|STI|HIV|wenery|chlamydi)/i,
    ],
  },

  // Physical-symptom triage scenarios. Lower priority than the time-sensitive
  // sexual-health intents so that a message mentioning both ("pekła guma i
  // boli mnie głowa ze stresu") still routes to PREGNANCY_SCARE. Within the
  // physical group, all peers are tied — first regex hit wins via filter order.
  {
    intent: "TRIAGE_ANKLE",
    priority: 50,
    patterns: [
      /\b(kostk|skok|stopa|stop[eę])\w*\s*(skr[eę]c|zwich|opuchl|spuchl|boli|skr[eę]t)/i,
      /\b(skr[eę]c|zwich)\w*\s*(kostk|stop|nog)/i,
      /\b(podwin[eę]ł|wykr[eę]c)\w*\s*(kostk|stop|nog)/i,
    ],
  },
  {
    intent: "TRIAGE_CHEST",
    priority: 50,
    patterns: [
      /\b(klatk\w*\s*piersiow|w\s*klatce|pod\s*mostkiem|za\s*mostkiem)/i,
      /\b(k[lł]uje|gniecie|ucisk|pali)\w*\s*w\s*(klatce|piersiach|sercu)/i,
      /\bserce\s*(boli|k[lł]uje|wali|przyspiesz)/i,
      /\bzawal|zawał/i,
    ],
  },
  {
    intent: "TRIAGE_HEADACHE",
    priority: 45,
    patterns: [
      /\b(g[lł]ow[ay])\b[^.!?\n]{0,20}?\b(boli|bola|pulsuj|rozsadz|p[eę]ka)/i,
      /\b(bol|boli|pulsuj|rozsadz)\w*\s*(g[lł]ow|skronie|czo[lł])/i,
      /\bmigren\w*/i,
      /\bb[oó]l\s*g[lł]owy/i,
    ],
  },
  {
    intent: "TRIAGE_URTI",
    priority: 45,
    patterns: [
      /\b(katar|smarkam|zatkany\s*nos|zatkane\s*zatoki)/i,
      /\b(boli\s*mnie\s*gard[lł]o|gard[lł]o\s*mnie\s*boli|bol[iaą]\s*gard[lł]o)/i,
      /\b(kaszel|kaszl[eę]|kaszl[aą])\w*/i,
      /\bprzezi[eę]bi\w*/i,
      /\b(infekcj|grypa|grypk)\w*\s*(g[oó]rnych|nosa|gard[lł]a)?/i,
      /\b(zapaleni|chrypka|chrypk[aą])\s*(gard[lł]a|krtani|nosa)/i,
    ],
  },
  {
    intent: "TRIAGE_GASTRO",
    priority: 45,
    patterns: [
      /\b(brzuch|brzuszek|brzucha)\b[^.!?\n]{0,20}?\b(boli|bola|skr[eę]c|kr[eę]c)/i,
      /\b(bol|boli|skr[eę]c)\w*\s*(brzuch|brzucha|w\s*brzuch)/i,
      /\bbiegunk\w*|\brozwoln/i,
      /\b(wymiotuj|wymioty|womituj|rzyga|rzygam)/i,
      /\b(zatru|zatruci|niestrawno|zgaga)\w*/i,
      /\bnudno[sś]ci/i,
    ],
  },
];

export function matchIntentRule(text: string): IntentLabel | null {
  if (!text) return null;
  const matches = RULES.filter((r) => r.patterns.some((p) => p.test(text)));
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.priority - a.priority);
  return matches[0].intent;
}
