import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Phone,
  Stethoscope,
} from "lucide-react";

import type { Decision } from "@/lib/scenarios/types";

const URGENCY_LABEL: Record<
  Decision["urgency"],
  { label: string; tone: "danger" | "warn" | "muted" }
> = {
  EMERGENCY: { label: "PILNE — DZIAŁAJ TERAZ", tone: "danger" },
  URGENT: { label: "Pilne", tone: "danger" },
  SOON: { label: "W tym tygodniu", tone: "warn" },
  ROUTINE: { label: "Plan rozłożony w czasie", tone: "muted" },
};

const TONE: Record<
  "danger" | "warn" | "muted",
  string
> = {
  danger: "bg-red-50 text-red-700 border-red-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  muted: "bg-foreground/5 text-foreground/70 border-foreground/10",
};

function mockArbitrageSlot(specialist: string) {
  const today = new Date();
  const inTwoHours = new Date(today.getTime() + 2 * 3600 * 1000);
  const time = `${String(inTwoHours.getHours()).padStart(2, "0")}:${String(
    Math.floor(inTwoHours.getMinutes() / 15) * 15
  ).padStart(2, "0")}`;
  return {
    when: `Dziś, ${time}`,
    where: "Centrum Medyczne LUX MED — al. Jerozolimskie 65",
    specialist,
    discount: 30,
    originalPrice: 220,
    finalPrice: 154,
  };
}

export function DecisionCard({ decision }: { decision: Decision }) {
  const urgency = URGENCY_LABEL[decision.urgency];
  const slot = mockArbitrageSlot(decision.specialist);

  return (
    <div className="glass rounded-3xl overflow-hidden animate-in">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-foreground text-lg leading-tight">
            {decision.title}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-md border ${TONE[urgency.tone]}`}
          >
            {urgency.label}
          </span>
        </div>
        <p className="leading-6 mt-2 text-foreground/60 text-[14px]">
          {decision.advice}
        </p>
      </div>

      <div className="px-4 pb-4 space-y-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-foreground/50">
            Twój plan
          </p>
          <ol className="space-y-2 mt-2">
            {decision.plan.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-foreground text-background text-[11px] font-medium mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[14px] leading-6 text-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
            <CalendarClock className="h-3.5 w-3.5" /> Znaleziono odwołaną wizytę
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="font-medium text-foreground text-[15px] flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                {slot.when}
              </div>
              <div className="text-[12px] text-foreground/60 mt-0.5 truncate">
                {slot.where}
              </div>
              <div className="text-[12px] text-foreground/60 flex items-center gap-1.5 mt-0.5">
                <Stethoscope className="h-3.5 w-3.5" /> {slot.specialist}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] text-foreground/40 line-through">
                {slot.originalPrice} zł
              </div>
              <div className="text-lg font-medium text-emerald-700">
                {slot.finalPrice} zł
              </div>
              <div className="text-[10px] uppercase tracking-wide font-medium text-emerald-600">
                −{slot.discount}%
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="h-[48px] bg-foreground text-background rounded-2xl w-full font-medium inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <CheckCircle2 className="h-4 w-4" />
          {decision.ctaLabel}
        </button>

        {decision.helplines.length > 0 && (
          <div className="border-t border-foreground/10 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-foreground/50">
              Telefony wsparcia · 24/7
            </p>
            <div className="space-y-1.5 mt-2">
              {decision.helplines.map((h) => (
                <a
                  key={h.number}
                  href={`tel:${h.number.replace(/\s/g, "")}`}
                  className="glass flex items-center justify-between rounded-xl px-3 h-11 text-[14px] transition-all hover:scale-[1.005]"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <Phone className="h-3.5 w-3.5 text-foreground/50" />
                    {h.name}
                  </span>
                  <span className="font-medium text-foreground">{h.number}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-foreground/40 text-center">
          Demo MVP — slot rezerwacyjny jest symulowany. Plan działania jest realny.
        </p>
      </div>
    </div>
  );
}
