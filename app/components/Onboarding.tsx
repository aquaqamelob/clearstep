"use client";

import { ArrowLeft, Heart, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Sheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cs:onboarded";

type Step = {
  id: string;
  /** Either a PNG mascot in /public OR a lucide icon. PNG wins if both set. */
  image?: string;
  Icon?: LucideIcon;
  title: string;
  description: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    image: "/doctor.png",
    title: "Cześć! Jestem ClearStep.",
    description:
      "Pomogę Ci ułożyć konkretny plan działania w 2-3 minuty — bez paniki, bez Google'a o 3 w nocy.",
    cta: "Dalej",
  },
  {
    id: "private",
    image: "/shield.png",
    title: "Wszystko zostaje u Ciebie.",
    description:
      "Bez konta, bez logowania. Twoje odpowiedzi nie wychodzą poza ten telefon.",
    cta: "Rozumiem",
  },
  {
    id: "safety",
    image: "/warning.png",
    title: "Decyzje od silnika, nie od AI.",
    description:
      "AI tylko zbiera fakty z rozmowy. Co dalej — wybiera deterministyczny silnik na podstawie medycznych źródeł.",
    cta: "Dalej",
  },
  {
    id: "ready",
    Icon: Heart,
    title: "Gotowi?",
    description: "Powiedz w jednym zdaniu, co się dzieje. Resztą zajmę się ja.",
    cta: "Zaczynamy",
  },
];

/**
 * Imperative trigger so other UI (e.g. header "?" button) can re-open the
 * onboarding tour without owning its state. The component listens for this
 * custom event and opens itself.
 */
export function reopenOnboarding() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("clearstep:onboarding:open"));
}

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Slight delay so the chat renders behind first → onboarding feels
        // like it's covering an actual app, not loading on a blank screen.
        const t = setTimeout(() => setOpen(true), 250);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  useEffect(() => {
    function onOpen() {
      setStep(0);
      setDirection(1);
      setOpen(true);
    }
    window.addEventListener("clearstep:onboarding:open", onOpen);
    return () => window.removeEventListener("clearstep:onboarding:open", onOpen);
  }, []);

  function complete() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
    // Reset for next time it's reopened from the menu.
    setTimeout(() => {
      setStep(0);
      setDirection(1);
    }, 300);
  }

  function next() {
    if (step + 1 >= STEPS.length) {
      complete();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function back() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && complete()}>
      {/* Header row: back · segmented progress · skip — kept light & vaul-clean */}
      <div className="flex items-center gap-2.5 mt-2">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          aria-label="Wstecz"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10"
            >
              <motion.div
                className="h-full bg-foreground"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={complete}
          aria-label="Pomiń"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Step body — popLayout swaps with directional slide+fade */}
      <div className="relative min-h-[260px] mt-8">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 * direction, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24 * direction, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="mb-6 flex h-28 w-28 items-center justify-center"
            >
              {current.image ? (
                <Image
                  src={current.image}
                  alt=""
                  width={112}
                  height={112}
                  priority
                  className="h-28 w-28 select-none"
                />
              ) : current.Icon ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-foreground/5">
                  <current.Icon
                    className={cn("h-11 w-11 text-foreground/70")}
                    strokeWidth={1.75}
                  />
                </div>
              ) : null}
            </motion.div>

            <h2 className="font-medium text-xl text-foreground text-balance">
              {current.title}
            </h2>
            <p className="leading-6 mt-2 text-foreground/60 text-balance max-w-sm text-[15px]">
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA — vaul-style: 44px primary submit */}
      <button
        type="button"
        onClick={next}
        className="h-[48px] bg-foreground text-background rounded-2xl mt-6 w-full font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {current.cta}
      </button>
      {!isLast && (
        <button
          type="button"
          onClick={complete}
          className="block w-full pt-3 text-xs text-foreground/50 hover:text-foreground/80 transition-colors"
        >
          Pomiń intro
        </button>
      )}
    </Sheet>
  );
}
