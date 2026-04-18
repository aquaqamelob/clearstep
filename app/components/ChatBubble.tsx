"use client";

import { Stethoscope, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

export const bubbleTransition = { ease: "easeOut" as const, duration: 0.22 };

export function ChatBubble({
  role,
  children,
  layoutId,
  className,
}: {
  role: "assistant" | "user";
  children: React.ReactNode;
  /** Pass the same layoutId on the input "ghost" to morph between them. */
  layoutId?: string;
  className?: string;
}) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-2 animate-in",
        isAssistant ? "justify-start" : "justify-end",
        className
      )}
    >
      {isAssistant && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
          <Stethoscope className="h-3.5 w-3.5" />
        </div>
      )}
      <motion.div
        layoutId={layoutId}
        transition={bubbleTransition}
        className={cn(
          "max-w-[85%] rounded-lg px-3.5 py-2 text-[15px] leading-snug",
          isAssistant
            ? "bg-card text-foreground border border-foreground/10"
            : "bg-foreground text-background"
        )}
      >
        {children}
      </motion.div>
      {!isAssistant && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={bubbleTransition}
        className="flex gap-2"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
          <Stethoscope className="h-3.5 w-3.5" />
        </div>
        <div className="rounded-lg border border-foreground/10 bg-card px-3.5 py-2.5">
          <div className="flex gap-1">
            <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-foreground/40" />
            <span
              className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-foreground/40"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-foreground/40"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
