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
];

export function matchIntentRule(text: string): IntentLabel | null {
  if (!text) return null;
  const matches = RULES.filter((r) => r.patterns.some((p) => p.test(text)));
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.priority - a.priority);
  return matches[0].intent;
}
