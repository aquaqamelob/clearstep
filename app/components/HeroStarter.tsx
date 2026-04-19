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
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="glass flex h-28 w-28 items-center justify-center rounded-3xl"
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
        transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
        className="font-medium text-xl text-foreground text-balance text-center mt-6"
      >
        Co się dzieje?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
        className="leading-6 mt-2 text-foreground/60 text-balance text-center text-[15px] max-w-xs"
      >
        Wybierz coś bliskiego albo napisz po swojemu.
      </motion.p>

      <motion.div
        className="w-full space-y-2 mt-8"
        initial="hidden"
        animate="visible"
        variants={{
          // Parent has no visual change of its own — it just orchestrates
          // the staggered entrance of children via variants. Variants are
          // applied synchronously through the React tree on first commit,
          // which prevents the "flash of final state" you'd get with
          // per-child `initial`/`animate` + delay (children would paint
          // once with `animate` styles before motion's effect ran on a
          // warm remount, e.g. after Reset).
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
        }}
      >
        {CHOICES.map((c) => (
          <motion.button
            key={c.prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPick(c.prompt)}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ willChange: "transform, opacity" }}
            className={cn(
              "glass group flex w-full items-center gap-3 rounded-2xl p-3 text-left",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/40">
              <Image
                src={c.image}
                alt={c.alt}
                width={40}
                height={40}
                priority
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
      </motion.div>
    </div>
  );
}
