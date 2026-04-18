"use client";

import { Check, ClipboardCopy, Download } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Decision, ScenarioMeta } from "@/lib/scenarios/types";

export function DoctorSummary({
  scenario,
  facts,
  decision,
}: {
  scenario: ScenarioMeta;
  facts: Record<string, string | number | boolean>;
  decision: Decision;
}) {
  const [copied, setCopied] = useState(false);

  const labelByKey = useMemo(
    () => Object.fromEntries(scenario.factSchema.map((f) => [f.key, f.label])),
    [scenario]
  );

  const factEntries = Object.entries(facts).filter(([k]) => labelByKey[k]);

  const markdown = useMemo(() => {
    const ts = new Date().toLocaleString("pl-PL");
    const factLines = factEntries
      .map(([k, v]) => `- **${labelByKey[k]}**: ${String(v)}`)
      .join("\n");
    return `# Podsumowanie ClearStep dla specjalisty\n\n_Wygenerowano: ${ts}_\n\n**Scenariusz**: ${scenario.label}\n\n## Zebrane fakty\n${factLines}\n\n## Sugerowana ścieżka\n- **Pilność**: ${decision.urgency}\n- **Rekomendowany specjalista**: ${decision.specialist}\n- **Kierunek działania**: ${decision.title}\n\n## Plan przekazany pacjentowi\n${decision.plan.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n---\n_To podsumowanie nie jest diagnozą. Jest wywiadem wstępnym zebranym przez ClearStep, narzędzie wsparcia decyzji._`;
  }, [factEntries, labelByKey, scenario, decision]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success("Skopiowano podsumowanie do schowka");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Nie udało się skopiować — zaznacz tekst ręcznie");
    }
  };

  const onDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearstep-podsumowanie-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plik pobrany");
  };

  return (
    <div className="rounded-lg border border-foreground/10 bg-card overflow-hidden animate-in">
      <div className="flex items-start gap-3 p-4">
        <Image
          src="/medical-report.png"
          alt="Raport medyczny"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 select-none"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground text-[15px]">
            Podsumowanie dla lekarza
          </h3>
          <p className="leading-5 mt-1 text-foreground/60 text-[12px]">
            Pokaż lekarzowi przy wizycie — oszczędzi 5-10 minut wywiadu.
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3 space-y-1.5">
          {factEntries.length === 0 ? (
            <p className="text-[12px] text-foreground/50 italic">Brak faktów.</p>
          ) : (
            factEntries.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-[13px]">
                <span className="text-foreground/60">{labelByKey[k]}</span>
                <span className="font-medium text-right text-foreground">
                  {String(v)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="h-9 flex-1 rounded-lg border border-foreground/10 bg-card text-[13px] font-medium text-foreground inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-foreground/5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="h-9 flex-1 rounded-lg border border-foreground/10 bg-card text-[13px] font-medium text-foreground inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-foreground/5"
          >
            <Download className="h-3.5 w-3.5" />
            Pobierz .md
          </button>
        </div>
      </div>
    </div>
  );
}
