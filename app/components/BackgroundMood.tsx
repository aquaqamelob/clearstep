"use client";

import { useMemo } from "react";

/**
 * Mood background — crossfade between 4 fixed palettes.
 *
 * Why crossfade instead of CSS custom-property transition:
 * the previous version relied on `@property` + `transition-property: --color-a`
 * to interpolate var()s inside background-image. That works only in Chrome 85+,
 * Safari 16.4+, Firefox 128+ — and even there, the visible delta between
 * adjacent low-saturation palettes was being eaten by the bg-card/55+
 * overlays on header, footer, and bubbles.
 *
 * Now: render all palettes as stacked fixed-position divs, drive opacity
 * with plain CSS transition (works everywhere), pick the active one by
 * mood. The non-active layers stay rendered (opacity 0) so transitions
 * are pure compositor work — zero layout/paint cost mid-animation.
 *
 * Mood mapping (the higher, the "happier"):
 *   0.00  panic / start          — calm cool blue + lavender + mint
 *   0.33  collecting facts       — sky + amber + rose
 *   0.66  almost decided         — peach + rose + lime
 *   1.00  decision / "you got it" — sun + coral + fresh green
 *
 * Emergency stays low (mood = 0): cool, calm — never euphoric over 112.
 */
/**
 * iOS-style soft palette — high lightness, mid-low saturation. The visible
 * mood shift comes mostly from hue rotation; the glass layer's `saturate(180%)`
 * filter amplifies it back through the frosted surface, the way iOS bumps
 * wallpaper saturation under a translucent sheet.
 */
const PALETTES: Array<[string, string, string]> = [
  ["#dbeafe", "#e0e7ff", "#dcfce7"],
  ["#bae6fd", "#fef3c7", "#ffe4e6"],
  ["#fef3c7", "#fed7aa", "#ecfccb"],
  ["#fef9c3", "#fed7aa", "#d1fae5"],
];

function gradient(p: readonly [string, string, string]): string {
  return `linear-gradient(45deg, ${p[0]}, ${p[1]}, ${p[2]})`;
}

function blobGradient(p: readonly [string, string, string]): string {
  return `linear-gradient(45deg, ${p[0]}, ${p[1]})`;
}

export function BackgroundMood({ mood }: { mood: number }) {
  const activeIdx = useMemo(() => {
    const clamped = Math.min(1, Math.max(0, mood));
    return Math.round(clamped * (PALETTES.length - 1));
  }, [mood]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {PALETTES.map((palette, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
          style={{
            opacity: i === activeIdx ? 1 : 0,
            background: gradient(palette),
          }}
        >
          {/* Two animated blobs, one per layer, that float gently. They use
           * the SAME palette as their parent so when we crossfade layers,
           * blobs crossfade naturally too — no second animation system. */}
          <div
            className="cs-blob cs-blob-a"
            style={{ background: blobGradient(palette) }}
          />
          <div
            className="cs-blob cs-blob-b"
            style={{ background: blobGradient(palette) }}
          />
        </div>
      ))}
    </div>
  );
}
