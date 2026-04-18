import { Phone } from "lucide-react";
import Image from "next/image";

const HELPLINES = [
  { name: "Pogotowie / numer alarmowy", number: "112", primary: true },
  { name: "Telefon Zaufania dla Dorosłych", number: "116 123" },
  { name: "Telefon Zaufania dla Dzieci i Młodzieży", number: "116 111" },
  { name: "ITAKA — Centrum Wsparcia w Kryzysie", number: "800 70 2222" },
];

export function EmergencyCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col animate-in">
      <div className="flex items-center justify-center">
        <Image
          src="/warning.png"
          alt=""
          width={88}
          height={88}
          className="h-22 w-22 select-none"
        />
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50/60 p-4 mt-4">
        <h3 className="font-medium text-red-700 text-[14px] leading-tight">
          Potrzebujesz teraz innego rodzaju pomocy
        </h3>
        <p className="leading-6 mt-1.5 text-red-700/80 text-[13px]">
          {message}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        {HELPLINES.map((h) => (
          <a
            key={h.number}
            href={`tel:${h.number.replace(/\s/g, "")}`}
            className={
              h.primary
                ? "h-[52px] rounded-lg bg-red-600 text-white inline-flex items-center justify-between px-4 font-medium transition-opacity hover:opacity-95 active:opacity-90"
                : "h-[44px] rounded-lg border border-foreground/10 bg-card text-foreground inline-flex items-center justify-between px-3.5 transition-colors hover:bg-foreground/5"
            }
          >
            <span className="flex items-center gap-2 text-[14px]">
              <Phone className={h.primary ? "h-4 w-4" : "h-3.5 w-3.5 text-foreground/50"} />
              {h.name}
            </span>
            <span className={h.primary ? "text-base font-medium" : "text-[14px] font-medium"}>
              {h.number}
            </span>
          </a>
        ))}
      </div>

      <p className="text-[11px] text-foreground/50 mt-3 leading-5">
        Wszystkie powyższe są bezpłatne i działają 24/7. Zostań na linii nawet
        jeśli nie wiesz, co powiedzieć — operator pomoże.
      </p>
    </div>
  );
}
