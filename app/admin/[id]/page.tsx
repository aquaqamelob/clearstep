import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, FileJson, ListChecks, Sparkles, TestTube2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScenario } from "@/lib/scenarios/loader";

import { FlowView } from "./FlowView";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = getScenario(id);
  return { title: s ? `Admin · ${s.label}` : "Admin" };
}

const URGENCY_VARIANT: Record<
  string,
  "destructive" | "warning" | "secondary" | "default"
> = {
  EMERGENCY: "destructive",
  URGENT: "destructive",
  SOON: "warning",
  ROUTINE: "secondary",
};

export default async function AdminScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = getScenario(id);
  if (!s) notFound();

  return (
    <div className="cs-bg min-h-dvh">
      <div className="mx-auto w-full max-w-7xl p-6 space-y-6">
        <header className="space-y-2 border-b border-border pb-4">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Wszystkie scenariusze
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{s.label}</h1>
              <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
            </div>
            <Badge variant="outline" className="shrink-0 mt-2">
              {s.id}
            </Badge>
          </div>
        </header>

        <FlowView scenario={s} />

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Pierwsza wiadomość bota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="border-l-2 border-primary pl-3 text-sm italic">
              {s.greeting}
            </blockquote>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Schemat faktów do zebrania ({s.factSchema.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              LLM ma za zadanie zebrać te fakty w trakcie wywiadu. Każdy
              <code className="mx-1 px-1 rounded bg-muted text-[10px]">required</code>
              musi być zebrany przed wywołaniem decyzji.
            </p>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {s.factSchema.map((f) => (
              <div key={f.key} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {f.key}
                  </code>
                  <Badge variant={f.required ? "default" : "outline"}>
                    {f.required ? "wymagane" : "opcjonalne"}
                  </Badge>
                  <Badge variant="secondary">{f.type}</Badge>
                </div>
                <div className="text-sm">{f.label}</div>
                {f.options && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {f.options.map((o) => (
                      <span
                        key={o}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                )}
                {f.hint && (
                  <p className="text-xs text-muted-foreground italic">💡 {f.hint}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-primary" />
              Możliwe decyzje ({s.decisions.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Decyzję wybiera deterministyczna funkcja TypeScript w
              <code className="mx-1 px-1 rounded bg-muted text-[10px]">lib/scenarios/decide.ts</code>
              na podstawie zebranych faktów. AI nie wybiera decyzji.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.decisions.map((d) => (
              <div key={d.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {d.id}
                    </code>
                    <Badge variant={URGENCY_VARIANT[d.urgency] ?? "secondary"}>
                      {d.urgency}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.specialist}</span>
                </div>
                <div className="font-medium text-sm">{d.title}</div>
                <p className="text-xs text-muted-foreground">{d.advice}</p>
                <ol className="text-xs space-y-0.5 list-decimal pl-4 text-muted-foreground">
                  {d.plan.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Reguły decyzyjne (dokumentacja)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Zapis czytelny dla człowieka. Egzekucja w
              <code className="mx-1 px-1 rounded bg-muted text-[10px]">lib/scenarios/decide.ts</code>.
            </p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {s.rules.map((r, i) => (
              <div key={i} className="text-xs flex items-start gap-2 font-mono">
                <span className="text-muted-foreground">jeśli</span>
                <code className="bg-muted px-1.5 py-0.5 rounded flex-1">{r.when}</code>
                <span className="text-muted-foreground">→</span>
                <code className="text-primary">{r.decisionId}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">System prompt LLM</CardTitle>
            <p className="text-xs text-muted-foreground">
              Jedyne, co AI „wie”. Ograniczone tylko do zbierania faktów + safety
              escalation. Bez prawa do diagnozy.
            </p>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted/40 p-3 rounded border border-border leading-relaxed">
              {s.systemPrompt}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Źródła medyczne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 list-disc pl-5">
              {s.sources.map((src, i) => (
                <li key={i}>{src}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary" /> Pełny JSON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-[11px] bg-muted/40 p-3 rounded border border-border overflow-x-auto leading-relaxed">
              {JSON.stringify(s, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
