"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function InstallHint() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  // Read browser-only APIs after mount to avoid SSR/CSR mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const mql = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mql.addEventListener("change", onChange);

    const onBefore = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", onBefore);

    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("beforeinstallprompt", onBefore);
    };
  }, []);

  if (!mounted || isStandalone) return null;

  const onClick = async () => {
    if (canPrompt && deferredPromptRef.current) {
      await deferredPromptRef.current.prompt();
      setCanPrompt(false);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Zainstaluj aplikację"
        className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-colors"
      >
        <Download className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/30 backdrop-blur-sm p-4 animate-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[10px] bg-card shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-foreground text-[15px]">
                Zainstaluj ClearStep
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground/50 hover:text-foreground transition-colors -m-1 p-1"
                aria-label="Zamknij"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isIOS ? (
              <div className="space-y-2 text-[14px] mt-3">
                <p className="text-foreground/80">Na iPhone / iPad:</p>
                <ol className="space-y-1.5 text-foreground/60 pl-4 list-decimal">
                  <li>
                    Stuknij ikonę <Share className="inline h-3.5 w-3.5" />{" "}
                    Udostępnij na dole.
                  </li>
                  <li>Wybierz „Dodaj do ekranu początkowego”.</li>
                  <li>Potwierdź „Dodaj”.</li>
                </ol>
              </div>
            ) : (
              <p className="leading-6 mt-3 text-foreground/60 text-[14px]">
                W menu przeglądarki (⋮) wybierz „Zainstaluj aplikację” lub
                „Dodaj do ekranu głównego”.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-[44px] bg-foreground text-background rounded-lg w-full mt-6 font-medium transition-opacity hover:opacity-90"
            >
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
