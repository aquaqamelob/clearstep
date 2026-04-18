/**
 * Hard-coded safety pre-filter. Runs on EVERY user message before any LLM call.
 * Hits here bypass the LLM entirely and route to the EmergencyCard.
 *
 * Lists are intentionally broad. False positives (showing 112 when not needed)
 * are acceptable; false negatives are NOT.
 */
const RED_FLAG_PATTERNS: RegExp[] = [
  // Suicide / self-harm
  /\b(samob[oó]j|odebra[cć] sobie [zż]ycie|zabi[cć] si[eę]|chc[eę] umrze[cć]|nie chc[eę] [zż]y[cć]|skończyć ze sob[ąa]|skoczyć z|powiesi[cć] si[eę]|podci[ąa][cć] sobie|przedawkowa[cć])/i,
  /\b(suicide|kill myself|end my life|want to die|self.?harm|cutting myself)/i,

  // Acute physical emergencies
  /\b(ból w klatce|atak serca|zawał|nie mog[eę] oddycha[cć]|duszno[sś][cć]|krztusz[eę] si[eę])/i,
  /\b(chest pain|heart attack|can'?t breathe|choking)/i,

  // Heavy bleeding
  /\b(krwotok|krew leci|du[zż]o krwi|nie mog[eę] zatrzyma[cć] krwawienia|krwawi[eę] obficie)/i,
  /\b(bleeding (heavily|out)|massive bleeding|hemorrhag)/i,

  // Stroke / neurological
  /\b(udar|porażenie|nie czuj[eę] ręki|nie czuj[eę] nogi|paralyz)/i,

  // Acute abdominal pain (relevant to pregnancy scenario – ectopic)
  /\b(bardzo silny b[oó]l brzucha|ostry b[oó]l brzucha|brzuch pęka|severe abdominal pain)/i,

  // Overdose / poisoning
  /\b(przedawkowa[lł]|wzi[ąa][lł]em za du[zż]o|po[lł]kn[ąa][lł]em|zatrucie|overdose|poisoned)/i,

  // Loss of consciousness
  /\b(stracił|stracilam przytomność|zemdlałem|zemdlała|uncons|fainted)/i,
];

export function isRedFlag(text: string): boolean {
  if (!text) return false;
  return RED_FLAG_PATTERNS.some((re) => re.test(text));
}

export const EMERGENCY_NUMBERS = {
  emergency: "112",
  mentalCrisis: "116 123",
  childCrisis: "116 111",
  itaka: "800 70 2222",
} as const;
