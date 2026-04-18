import { Calendar, Construction } from "lucide-react";

export function ComingSoonCard({
  intent,
  message,
}: {
  intent: string;
  message: string;
}) {
  const label =
    intent === "STD_PANIC"
      ? "Wątpliwości po ekspozycji / objawy weneryczne"
      : "Inna dolegliwość zdrowotna";

  return (
    <div className="glass rounded-2xl p-4 animate-in">
      <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
        <Construction className="h-4 w-4 text-amber-600" />
        {label}
      </div>
      <p className="leading-6 mt-2 text-foreground/60 text-[14px]">{message}</p>
      <button
        type="button"
        className="h-[48px] bg-foreground text-background rounded-2xl w-full mt-4 font-medium inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <Calendar className="h-4 w-4" />
        Znajdź lekarza POZ na dziś
      </button>
    </div>
  );
}
