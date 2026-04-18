import Link from "next/link";
import { ArrowRight, Database, FileJson, GitBranch, Library, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listScenarios } from "@/lib/scenarios/loader";

export const metadata = { title: "Admin — Scenariusze" };

export default function AdminIndex() {
  const scenarios = listScenarios();

  return (
    <div className="cs-bg min-h-dvh">
      <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Library className="h-5 w-5 text-primary" />
              ClearStep — Admin (read-only)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Audytowalny widok scenariuszy z wizualizacją deterministycznego flow.
              Zmiany robi się przez edycję plików w
              <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-xs">data/scenarios/*.json</code>
              i commit.
            </p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Czat
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s) => (
            <Link key={s.id} href={`/admin/${s.id}`} className="group">
              <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md bg-card/95 backdrop-blur overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{s.label}</CardTitle>
                    <Badge variant="outline">{s.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{s.description}</p>

                  <FlowThumbnail
                    factCount={s.factSchema.length}
                    decisionCount={s.decisions.length}
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileJson className="h-3.5 w-3.5" /> {s.factSchema.length} faktów
                      </span>
                      <span>{s.decisions.length} decyzji</span>
                      <span>{s.rules.length} reguł</span>
                    </div>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      Otwórz flow <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tiny static SVG preview of the scenario flow shape — pure decoration.
 * Echoes the FlowView aesthetic: input → LLM → router → N decisions.
 */
function FlowThumbnail({
  factCount,
  decisionCount,
}: {
  factCount: number;
  decisionCount: number;
}) {
  void factCount;
  return (
    <div className="relative h-24 rounded-md border border-border bg-[radial-gradient(circle,_rgba(0,0,0,0.06)_1px,_transparent_1px)] [background-size:14px_14px] overflow-hidden">
      <svg
        viewBox="0 0 320 96"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* edges */}
        <path
          d="M 50 48 C 80 48, 80 48, 110 48"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />
        <path
          d="M 170 48 C 200 48, 200 48, 230 48"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.2"
        />
        {Array.from({ length: Math.min(decisionCount, 4) }).map((_, i) => {
          const total = Math.min(decisionCount, 4);
          const y = 16 + i * ((96 - 32) / Math.max(1, total - 1 || 1));
          return (
            <path
              key={i}
              d={`M 270 48 C 290 48, 290 ${y}, 305 ${y}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
              opacity={0.7}
            />
          );
        })}
      </svg>
      {/* nodes */}
      <MiniNode x={20} y={36} color="bg-sky-500" Icon={GitBranch} />
      <MiniNode x={120} y={36} color="bg-amber-500" Icon={Database} label="LLM" />
      <MiniNode x={240} y={36} color="bg-emerald-500" Icon={Workflow} />
      {Array.from({ length: Math.min(decisionCount, 4) }).map((_, i) => {
        const total = Math.min(decisionCount, 4);
        const y =
          16 + i * ((96 - 32) / Math.max(1, total - 1 || 1)) - 6;
        return (
          <span
            key={i}
            className="absolute h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-400"
            style={{ left: 300, top: y }}
          />
        );
      })}
    </div>
  );
}

function MiniNode({
  x,
  y,
  color,
  Icon,
  label,
}: {
  x: number;
  y: number;
  color: string;
  Icon: typeof GitBranch;
  label?: string;
}) {
  return (
    <div
      className="absolute flex items-center gap-1 rounded-md bg-white border border-foreground/10 px-1.5 py-1 shadow-sm"
      style={{ left: x, top: y }}
    >
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      <Icon className="h-3 w-3 text-foreground/60" />
      {label && (
        <span className="text-[9px] font-medium text-foreground/70 pr-0.5">
          {label}
        </span>
      )}
    </div>
  );
}
