"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type Choice = {
  prompt: string;
  label: string;
  hint: string;
  image: string;
  alt: string;
};

const CHOICES: Choice[] = [
  {
    prompt: "Pękła prezerwatywa wczoraj wieczorem",
    label: "Sytuacja seksualna",
    hint: "Zabezpieczenie zawiodło, niepewność co dalej",
    image: "/pregnancy-test.png",
    alt: "Test ciążowy",
  },
  {
    prompt: "Od miesiąca nie mogę spać i nic mnie nie cieszy",
    label: "Głowa / nastrój",
    hint: "Bezsenność, anhedonia, niepokój",
    image: "/health-journal.png",
    alt: "Dziennik zdrowia",
  },
  {
    prompt: "Mam objawy które mnie niepokoją",
    label: "Objawy fizyczne",
    hint: "Nieoczywiste, ale nie chcesz ignorować",
    image: "/health-monitor.png",
    alt: "Monitor pracy serca",
  },
];

/**
 * Duolingo-style hero replacing the boring empty-chat state.
 * Reuses onboarding's visual language (big colored mascot, large tappable
 * cards, springy entrance) so the chat feels like a continuation of the
 * onboarding flow — not a separate app.
 *
 * The mascot and answer cards use 3D-style PNGs from /public so the surface
 * has weight and personality (vs. flat lucide outlines).
 */
export function HeroStarter({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center pt-4 pb-4">
      <motion.div
        initial={{ scale: 0.7, rotate: -10, y: 8 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 16 }}
        className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-foreground/10"
      >
        <Image
          src="/medical-kit.png"
          alt="Apteczka"
          width={80}
          height={80}
          priority
          className="h-20 w-20 select-none"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3, ease: "easeOut" }}
        className="font-medium text-xl text-foreground text-balance text-center mt-6"
      >
        Co się dzieje?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
        className="leading-6 mt-2 text-foreground/60 text-balance text-center text-[15px] max-w-xs"
      >
        Wybierz coś bliskiego albo napisz po swojemu.
      </motion.p>

      <div className="w-full space-y-2 mt-8">
        {CHOICES.map((c, i) => (
          <motion.button
            key={c.prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPick(c.prompt)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15 + i * 0.06,
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg border border-foreground/10",
              "bg-card p-2.5 text-left",
              "transition-colors hover:bg-foreground/[0.03]",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-foreground/[0.03]">
              <Image
                src={c.image}
                alt={c.alt}
                width={40}
                height={40}
                className="h-10 w-10 select-none"
              />
            </div>
            <div className="min-w-0 flex-1 leading-snug">
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
                {c.label}
              </p>
              <p className="text-[14px] font-medium text-foreground truncate">
                {c.prompt}
              </p>
              <p className="text-[11px] text-foreground/50 truncate">
                {c.hint}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
