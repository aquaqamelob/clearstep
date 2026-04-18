"use client";

import { useEffect, useRef } from "react";

/**
 * 1:1 z FeelingApp: ustawiamy --color-a/b/c na wrapperze, a CSS w globals.css
 * (`.cs-mood-bg` + ::before/::after, transition-property na custom propsach)
 * sam interpoluje gradient i bloby między paletami.
 *
 * Mapowanie mood → paleta (im wyżej, tym "weselej"):
 *   0.00  panika / start          — chłodne błękit + lawenda + mięta
 *   0.33  zbieramy fakty          — błękit + cytryna + brzoskwinia
 *   0.66  prawie gotowe           — brzoskwinia + róż + miód
 *   1.00  decyzja / "dasz radę"   — słońce + koral + świeża zieleń
 *
 * Emergency trzymamy nisko (mood = 0): chłodne, spokojne — nigdy euforii nad 112.
 */
const PALETTES: Array<[string, string, string]> = [
  ["#bae6fd", "#c7d2fe", "#a7f3d0"],
  ["#7dd3fc", "#fde68a", "#fecaca"],
  ["#fcd34d", "#fbcfe8", "#d9f99d"],
  ["#fde047", "#fdba74", "#86efac"],
];

export function BackgroundMood({ mood }: { mood: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clamped = Math.min(1, Math.max(0, mood));
    const idx = Math.round(clamped * (PALETTES.length - 1));
    const [a, b, c] = PALETTES[idx];
    el.style.setProperty("--color-a", a);
    el.style.setProperty("--color-b", b);
    el.style.setProperty("--color-c", c);
  }, [mood]);

  return <div ref={ref} aria-hidden className="cs-mood-bg" />;
}
