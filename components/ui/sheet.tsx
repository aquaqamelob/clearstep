"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Bottom-sheet primitive — visual styling lifted from vaul (clean utility look:
 * small 10px corner, edge-to-edge bg, max-w-md centered scroll container,
 * unobtrusive handle). Motion is still our own (motion/react drag + spring),
 * because we want one animation engine across the app and we re-use the same
 * sheet for multi-view onboarding.
 *
 * Layout:
 *   wrapper (fixed bottom, edge-to-edge, max-h-[82vh], rounded-t-[10px])
 *     └─ scroll container (max-w-md w-full mx-auto overflow-auto p-4)
 *          └─ handle bar
 *          └─ children
 *
 * Children should NOT add their own outer padding — Sheet handles it.
 */

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const containerVariants = {
  initial: { y: "calc(100% + 4rem)" },
  animate: { y: 0 },
  exit: { y: "calc(100% + 4rem)" },
};

export function Sheet({
  open,
  onOpenChange,
  dismissible = true,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When false: no backdrop click, no swipe, no ESC — only the consumer can close it. */
  dismissible?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-resize: when inner content height changes (e.g. switching onboarding
  // step), animate the wrapper height. CSS transition handles interpolation;
  // first measure snaps because `auto` → `Xpx` is not transitionable.
  // max-h-[82vh] caps it; if content exceeds that, inner div scrolls.
  useEffect(() => {
    if (!open) return;
    const inner = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!inner || !wrapper) return;
    const sync = () => {
      wrapper.style.height = `${inner.offsetHeight}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [open]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC closes (when dismissible).
  useEffect(() => {
    if (!open || !dismissible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissible, onOpenChange]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (!dismissible) return;
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            onClick={() => dismissible && onOpenChange(false)}
          />
          <motion.div
            ref={wrapperRef}
            drag={dismissible ? "y" : false}
            dragConstraints={{ top: 0, bottom: 100 }}
            dragSnapToOrigin
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
              "max-h-[82vh] rounded-t-[10px] bg-card shadow-xl",
              "[transition:height_220ms_ease]",
              "touch-none",
              className
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div
              ref={contentRef}
              className="max-w-md w-full mx-auto overflow-auto p-4 rounded-t-[10px]"
            >
              {/* Drag handle */}
              <div
                aria-hidden="true"
                className="mx-auto mb-2 h-1 w-10 rounded-full bg-foreground/15"
              />
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
