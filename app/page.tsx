"use client";

import { Info, RefreshCw, Send, Shield, Stethoscope } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";

import { AboutSheet } from "./components/AboutSheet";
import { BackgroundMood } from "./components/BackgroundMood";
import { ChatBubble, TypingBubble, bubbleTransition } from "./components/ChatBubble";
import { ComingSoonCard } from "./components/ComingSoonCard";
import { DecisionCard } from "./components/DecisionCard";
import { DoctorSummary } from "./components/DoctorSummary";
import { EmergencyCard } from "./components/EmergencyCard";
import { HeroStarter } from "./components/HeroStarter";
import { InstallHint } from "./components/InstallHint";
import { Onboarding } from "./components/Onboarding";

import type { ChatTurn, Decision } from "@/lib/scenarios/types";

type Msg = { role: "user" | "assistant"; content: string };

type ApiResponse =
  | { kind: "turn"; scenarioId: string; turn: ChatTurn }
  | { kind: "decision"; scenarioId: string; facts: Record<string, string | number | boolean>; decision: Decision }
  | { kind: "emergency"; reason: string; message: string }
  | { kind: "coming_soon"; intent: string; message: string }
  | { kind: "error"; message: string };

const INITIAL_GREETING =
  "Cześć. Jestem ClearStep. Pomogę Ci ułożyć konkretny plan działania w 2-3 minuty. Wszystko zostaje na Twoim telefonie — bez logowania. Opowiedz w jednym zdaniu, co się dzieje.";

const STORAGE_KEY = "cs:state";

type TerminalState =
  | { kind: "decision"; data: { facts: Record<string, string | number | boolean>; decision: Decision; scenarioId: string } }
  | { kind: "emergency"; message: string }
  | { kind: "coming_soon"; intent: string; message: string }
  | null;

type SavedState = {
  messages: Msg[];
  scenarioId: string | null;
  quickReplies: string[];
  terminal: TerminalState;
};

function readSavedState(): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (!Array.isArray(parsed.messages) || parsed.messages.length <= 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminal, setTerminal] = useState<TerminalState>(null);
  const [hydrated, setHydrated] = useState(false);

  const [scenarioMeta, setScenarioMeta] = useState<import("@/lib/scenarios/types").ScenarioMeta | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFresh = messages.length === 1 && !terminal;

  // Hydrate from sessionStorage AFTER mount to avoid SSR/CSR mismatch.
  // The initial render must match what the server emitted (default greeting).
  useEffect(() => {
    const saved = readSavedState();
    if (saved) {
      // Intentional one-shot hydration from sessionStorage after mount
      // to keep server HTML and first client render identical.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(saved.messages);
      setScenarioId(saved.scenarioId);
      setQuickReplies(saved.quickReplies);
      setTerminal(saved.terminal);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, terminal, quickReplies]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, scenarioId, quickReplies, terminal })
      );
    } catch {}
  }, [hydrated, messages, scenarioId, quickReplies, terminal]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setQuickReplies([]);
    setInput("");
    const newHistory: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          history: messages,
          userMessage: trimmed,
        }),
      });
      const data = (await res.json()) as ApiResponse;

      if (data.kind === "emergency") {
        setTerminal({ kind: "emergency", message: data.message });
        setMessages((m) => [...m, { role: "assistant", content: data.message }]);
        return;
      }
      if (data.kind === "coming_soon") {
        setTerminal({ kind: "coming_soon", intent: data.intent, message: data.message });
        setMessages((m) => [...m, { role: "assistant", content: data.message }]);
        return;
      }
      if (data.kind === "decision") {
        setTerminal({ kind: "decision", data });
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Mam wszystko, czego potrzebowałem. Oto Twój plan." },
        ]);
        if (!scenarioMeta) {
          try {
            const meta = await fetch(`/api/scenarios/${data.scenarioId}`).then((r) => r.json());
            setScenarioMeta(meta);
          } catch {}
        }
        return;
      }
      if (data.kind === "error") {
        setMessages((m) => [...m, { role: "assistant", content: data.message }]);
        return;
      }

      if (!scenarioId) setScenarioId(data.scenarioId);
      setMessages((m) => [...m, { role: "assistant", content: data.turn.message }]);
      setQuickReplies(data.turn.quick_replies ?? []);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Coś poszło nie tak po stronie sieci. Spróbuj jeszcze raz albo odśwież stronę.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function reset() {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([{ role: "assistant", content: INITIAL_GREETING }]);
    setScenarioId(null);
    setQuickReplies([]);
    setTerminal(null);
    setScenarioMeta(null);
    setInput("");
  }

  const inputDisabled = loading || terminal !== null;

  // Mood drives the animated background. The further into the conversation
  // the user is, the warmer/happier the gradient feels — until the decision
  // is shown (full sun). Emergencies stay calm/cool on purpose.
  const userTurns = messages.filter((m) => m.role === "user").length;
  // Larger initial step (0.34 instead of 0.18) so the FIRST user message
  // already pushes us to palette 1 — otherwise the change between idx 0
  // and idx 1 was triggering only after 1-2 turns and felt invisible.
  const mood =
    terminal?.kind === "emergency"
      ? 0
      : terminal?.kind === "decision"
        ? 1
        : terminal?.kind === "coming_soon"
          ? 0.7
          : Math.min(1, userTurns * 0.34);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <BackgroundMood mood={mood} />
      <Toaster position="top-center" richColors />
      <Onboarding />
      <AboutSheet open={aboutOpen} onOpenChange={setAboutOpen} />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
        <div
          className="sticky top-0 z-30 px-3"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <header className="glass-light flex items-center justify-between gap-2 rounded-full p-1.5 pl-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-medium text-sm text-foreground truncate">ClearStep</span>
                <span className="text-[10px] text-foreground/55 flex items-center gap-1 truncate">
                  <Shield className="h-2.5 w-2.5 shrink-0" /> Anonimowo · bez logowania
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!isFresh && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Zacznij od nowa"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all hover:scale-[1.05] active:scale-95"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setAboutOpen(true)}
                aria-label="O aplikacji"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all hover:scale-[1.05] active:scale-95"
              >
                <Info className="h-4 w-4" />
              </button>
              <InstallHint />
            </div>
          </header>
        </div>

        <div ref={scrollerRef} className="relative z-20 flex-1 overflow-y-auto px-4 py-5 space-y-3">
          {isFresh ? (
            <HeroStarter disabled={loading} onPick={send} />
          ) : null}

          {!isFresh && messages.map((m, i) => (
            <ChatBubble
              key={i}
              role={m.role}
              // 1:1 with InputMorphMessage: ALL user bubbles share the SAME
              // layoutId based on the current user-turn count. The form's
              // ghost has layoutId = `user-msg-${userTurns}` (one ahead), so
              // when a new user message lands, userTurns increments, every
              // user bubble's layoutId shifts up by one, and the new bubble
              // naturally inherits the layoutId the ghost used to hold —
              // that's what triggers the morph.
              //
              // No AnimatePresence here on purpose: bubbles only get appended
              // (never removed), and layoutId morphing works without one.
              layoutId={
                m.role === "user" ? `user-msg-${userTurns - 1}` : undefined
              }
            >
              {m.content}
            </ChatBubble>
          ))}

          {loading && <TypingBubble />}

          {terminal?.kind === "emergency" && (
            <div className="pt-2">
              <EmergencyCard message={terminal.message} />
            </div>
          )}

          {terminal?.kind === "coming_soon" && (
            <div className="pt-2">
              <ComingSoonCard intent={terminal.intent} message={terminal.message} />
            </div>
          )}

          {terminal?.kind === "decision" && (
            <div className="pt-2 space-y-3">
              <DecisionCard decision={terminal.data.decision} />
              {scenarioMeta && (
                <DoctorSummary
                  scenario={scenarioMeta}
                  facts={terminal.data.facts}
                  decision={terminal.data.decision}
                />
              )}
            </div>
          )}

          {terminal && (
            <div className="pt-3 flex items-center justify-center">
              <button
                type="button"
                onClick={reset}
                className="glass inline-flex items-center gap-1.5 px-3.5 py-2 text-xs text-foreground/70 hover:text-foreground rounded-full transition-all hover:scale-[1.02]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Zacznij od nowa
              </button>
            </div>
          )}
        </div>

        {!terminal && (
          <div
            className="sticky bottom-0 z-30 px-3 pt-2"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {!isFresh && quickReplies.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 pb-2">
                {quickReplies.map((q, i) => (
                  <motion.button
                    key={`${q}-${i}`}
                    type="button"
                    disabled={loading}
                    onClick={() => send(q)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.22 }}
                    whileTap={{ scale: 0.97 }}
                    className="glass-light rounded-full px-3.5 h-9 text-[13px] font-medium text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            )}

            <form
              className="glass-light relative flex items-center gap-2 rounded-full p-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  scenarioId
                    ? "Napisz odpowiedź lub wybierz powyżej…"
                    : "Opowiedz, co się dzieje…"
                }
                disabled={inputDisabled}
                autoFocus
                className="relative h-10 grow rounded-full bg-transparent pl-4 pr-2 text-[15px] text-foreground placeholder:text-foreground/55 outline-none disabled:opacity-50"
              />

              {/* Morph ghost — rounded-full to match the new pill input.
               * Positioned absolute over the input. On submit, motion morphs
               * the ghost's layoutId into the new user bubble in the list. */}
              <motion.div
                key={userTurns}
                layout="position"
                layoutId={`user-msg-${userTurns}`}
                transition={bubbleTransition}
                initial={{ opacity: 0.6, zIndex: -1 }}
                animate={{ opacity: 0.6, zIndex: -1 }}
                exit={{ opacity: 1, zIndex: 1 }}
                className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 flex items-center overflow-hidden rounded-full bg-white/50 pl-4 pr-3 text-[15px] text-background"
                style={{ right: "calc(2.5rem + 0.375rem)" }}
              >
                <span className="truncate">{input}</span>
              </motion.div>

              <button
                type="submit"
                disabled={inputDisabled || !input.trim()}
                aria-label="Wyślij"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-1.5 text-center text-[10px] text-foreground/50 leading-tight">
              Decyzje medyczne podejmuje deterministyczny silnik, nie AI.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
