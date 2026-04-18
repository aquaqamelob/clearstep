"use client";

import { HelpCircle, PlayCircle } from "lucide-react";
import Image from "next/image";

import { Sheet } from "@/components/ui/sheet";

import { reopenOnboarding } from "./Onboarding";

/**
 * Single-view sheet — proves the Sheet primitive is reusable beyond
 * onboarding. Opened from the header info button.
 *
 * Visual style: vaul-clean — minimal radius, no extra padding (Sheet provides
 * p-4), text rhythm via mt-* spacing.
 */
export function AboutSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-3 mt-2">
        <Image
          src="/doctor.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 select-none"
        />
        <div className="min-w-0">
          <h2 className="font-medium text-foreground">ClearStep</h2>
          <p className="text-xs text-foreground/60 leading-tight">
            Decision support · nie zastępuje lekarza
          </p>
        </div>
      </div>

      <ul className="space-y-2 mt-6">
        <Row
          image="/shield.png"
          title="Zero loginu, zero śladu"
          body="Twoje odpowiedzi nie wychodzą poza ten telefon. Klikniecie 'Zacznij od nowa' czyści wszystko."
        />
        <Row
          image="/warning.png"
          title="To nie diagnoza"
          body="Daję plan działania w stylu 'do kogo i kiedy iść'. Decyzję medyczną zawsze podejmuje człowiek."
        />
        <Row
          icon={<HelpCircle className="h-4 w-4" />}
          title="W zagrożeniu życia"
          body="112. Telefon zaufania (psychika): 116 123, 116 111 (młodzi)."
        />
      </ul>

      <button
        type="button"
        onClick={() => {
          onOpenChange(false);
          // Wait for sheet exit animation, then re-open onboarding.
          setTimeout(() => reopenOnboarding(), 320);
        }}
        className="h-[48px] mt-6 w-full rounded-2xl border border-foreground/10 bg-background text-foreground text-sm font-medium inline-flex items-center justify-center gap-2 transition-all hover:bg-foreground/5 active:scale-[0.99]"
      >
        <PlayCircle className="h-4 w-4" /> Pokaż intro jeszcze raz
      </button>
    </Sheet>
  );
}

function Row({
  icon,
  image,
  title,
  body,
}: {
  icon?: React.ReactNode;
  image?: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3">
      {image ? (
        <Image
          src={image}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 select-none"
        />
      ) : (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-foreground/70">
          {icon}
        </div>
      )}
      <div className="leading-snug min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-foreground/60 mt-0.5">{body}</p>
      </div>
    </li>
  );
}
