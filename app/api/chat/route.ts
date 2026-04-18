import { NextResponse } from "next/server";
import { z } from "zod";

import { llm, LLM_MODEL } from "@/lib/llm";
import { matchIntentRule } from "@/lib/intent-rules";
import { isRedFlag } from "@/lib/safety";
import { getScenario, listScenarios } from "@/lib/scenarios/loader";
import { ChatTurnSchema, type ChatTurn } from "@/lib/scenarios/types";
import { decide } from "@/lib/scenarios/decide";

export const runtime = "nodejs";

const RequestSchema = z.object({
  scenarioId: z.string().nullable().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
  userMessage: z.string().min(1).max(2000),
});

const INTENT_SYSTEM_PROMPT = `Jesteś klasyfikatorem intencji ClearStep. Otrzymujesz pierwszą wiadomość użytkownika w stresującej sytuacji medycznej. Twoje JEDYNE zadanie to przypisać ją do jednej z kategorii:

- PREGNANCY_SCARE — ryzyko nieplanowanej ciąży: pęknięta/zsunięta prezerwatywa ("pękła guma/gumka"), seks bez zabezpieczenia, "skończył w środku", zapomniana tabletka antykoncepcyjna, opóźniony okres, prośba o tabletkę "po"/EllaOne/Escapelle, obawa o ciążę.
- MENTAL_HEALTH — psychika: bezsenność, smutek, brak motywacji, lęk, panika, anhedonia, wypalenie, przewlekły stres, płaczliwość.
- STD_PANIC — obawa o chorobę weneryczną BEZ wątku ciąży: ryzykowny seks z osobą o nieznanym statusie zdrowotnym, podejrzane wydzieliny/wysypki/pieczenie, prośba o test na HIV/chlamydię/kiłę.
- GENERAL_SICK — inne fizyczne (gorączka, ból gardła, kaszel, ból brzucha, wysypka bez kontekstu seksualnego).
- EMERGENCY — zagrożenie życia: krwotok, samobójstwo, ból w klatce, omdlenie.

REGUŁY ROZSTRZYGNIĘĆ (bardzo ważne):

1. **Pęknięta/zsunięta prezerwatywa = ZAWSZE PREGNANCY_SCARE.** Nawet jeśli pojawia się ryzyko STI — okno na antykoncepcję awaryjną (72h) jest najbardziej krytyczne czasowo, więc to wygrywa. Użytkownik dostanie informacje o STI w scenariuszu PREGNANCY_SCARE.
2. Polski slang i literówki: "guma" / "gumka" = prezerwatywa. "pekla" / "pękła" / "zerwała" / "zsunęła" — wszystkie znaczą uszkodzenie. "Wpadka" = niezabezpieczony seks z ryzykiem ciąży.
3. Jeśli wiadomość jest jednym fragmentem typu "pekla guma", "wpadka wczoraj", "spóźnia mi się okres" — to PREGNANCY_SCARE, nie GENERAL_SICK.
4. STD_PANIC tylko gdy NIE MA wątku ciąży (np. mężczyzna piszący o pieczeniu po seksie z mężczyzną, podejrzane wydzieliny bez kontekstu cyklu).

PRZYKŁADY:
- "pekla guma" → PREGNANCY_SCARE
- "pękła nam prezerwatywa" → PREGNANCY_SCARE
- "uprawialiśmy seks bez gumki" → PREGNANCY_SCARE
- "spóźnia mi się okres o tydzień" → PREGNANCY_SCARE
- "potrzebuję tabletki po" → PREGNANCY_SCARE
- "od miesiąca nie mogę spać" → MENTAL_HEALTH
- "ciągle płaczę i nic mi się nie chce" → MENTAL_HEALTH
- "boję się że mam HIV po seksie z nieznajomym" → STD_PANIC
- "dziwna wydzielina z penisa" → STD_PANIC
- "boli mnie gardło i mam gorączkę" → GENERAL_SICK
- "krew leci mi z nosa od 30 minut" → EMERGENCY

Zwróć WYŁĄCZNIE JSON: { "intent": "<KATEGORIA>" }. Bez komentarza, bez markdown.`;

export async function POST(req: Request) {
  let body: z.infer<typeof RequestSchema>;
  try {
    const json = await req.json();
    body = RequestSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", detail: err instanceof Error ? err.message : "" },
      { status: 400 }
    );
  }

  // 1) Hard safety pre-filter — runs every turn, no LLM call.
  if (isRedFlag(body.userMessage)) {
    return NextResponse.json({
      kind: "emergency",
      reason: "red_flag",
      message:
        "To, co opisujesz, brzmi jak sytuacja, w której powinno*aś teraz zadzwonić po pomoc. Nie jestem w stanie odpowiedzieć na to bezpiecznie w czacie.",
    });
  }

  // 2) Intent classification on the first turn (no scenarioId yet).
  let scenarioId = body.scenarioId ?? null;
  if (!scenarioId) {
    try {
      // High-confidence Polish-slang shortcut. If a deterministic rule fires
      // (e.g. "pekła guma" → PREGNANCY_SCARE), trust it over the LLM — it's
      // free, instant, and immune to the LLM mis-routing condom-break to
      // STD_PANIC because it sees both pregnancy and STI risk.
      const ruleHit = matchIntentRule(body.userMessage);
      const intent = ruleHit ?? (await classifyIntent(body.userMessage));
      if (intent === "EMERGENCY") {
        return NextResponse.json({
          kind: "emergency",
          reason: "intent_emergency",
          message:
            "Z tego, co piszesz, brzmi to jak nagła sytuacja. Zadzwoń teraz pod 112.",
        });
      }
      if (intent === "STD_PANIC" || intent === "GENERAL_SICK") {
        return NextResponse.json({
          kind: "coming_soon",
          intent,
          message:
            "Ten scenariusz nie jest jeszcze pełni obsługiwany. Polecamy konsultację z lekarzem POZ – wizyta NFZ tego samego dnia lub prywatna telekonsultacja w 30 min.",
        });
      }
      scenarioId = intent; // PREGNANCY_SCARE or MENTAL_HEALTH
    } catch (err) {
      console.error("intent classification failed", err);
      return NextResponse.json(
        {
          kind: "error",
          message:
            "Nie udało się skontaktować z modelem AI. Sprawdź, czy OPENROUTER_API_KEY jest ustawiony w .env.local.",
        },
        { status: 500 }
      );
    }
  }

  const scenario = getScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json(
      { kind: "error", message: `Unknown scenario: ${scenarioId}` },
      { status: 400 }
    );
  }

  // 3) Run the LLM-driven interview turn.
  const factSchemaText = scenario.factSchema
    .map((f) => {
      const opts = f.options ? ` opcje: ${f.options.join(" | ")}` : "";
      const req = f.required ? "WYMAGANE" : "opcjonalne";
      return `- ${f.key} (${f.type}, ${req}): ${f.label}.${opts}${f.hint ? ` Hint: ${f.hint}` : ""}`;
    })
    .join("\n");

  const systemPrompt = `${scenario.systemPrompt}

SCHEMAT FAKTÓW DO ZEBRANIA:
${factSchemaText}

ZAWSZE odpowiadaj WYŁĄCZNIE w postaci JSON wg poniższego kształtu:
{
  "message": "<twoja krótka wiadomość, max 2 zdania, po polsku>",
  "quick_replies": ["<2-5 sensownych opcji do kliknięcia>"],
  "facts_collected": { "<key>": "<value>", ... },  // wszystkie fakty zebrane do tej pory, kumulatywnie
  "ready_for_decision": false,  // true tylko gdy WSZYSTKIE wymagane fakty są zebrane
  "escalate": null  // lub "EMERGENCY" jeśli pojawia się zagrożenie życia
}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...body.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: body.userMessage },
  ];

  let turn: ChatTurn;
  try {
    const completion = await llm().chat.completions.create({
      model: LLM_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = ChatTurnSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      throw new Error("LLM returned malformed turn");
    }
    turn = parsed.data;
  } catch (err) {
    console.error("LLM turn failed", err);
    return NextResponse.json(
      {
        kind: "error",
        message:
          "Asystent miał problem z odpowiedzią. Spróbuj jeszcze raz albo skontaktuj się bezpośrednio z lekarzem.",
      },
      { status: 500 }
    );
  }

  // 4) Mid-conversation safety net — LLM can also flag emergency.
  if (turn.escalate === "EMERGENCY") {
    return NextResponse.json({
      kind: "emergency",
      reason: "llm_escalated",
      message: turn.message,
    });
  }

  // 5) If LLM says we're done → run the deterministic decision engine.
  if (turn.ready_for_decision) {
    const decision = decide(scenario, turn.facts_collected);
    return NextResponse.json({
      kind: "decision",
      scenarioId: scenario.id,
      facts: turn.facts_collected,
      decision,
    });
  }

  // 6) Normal interview turn — frontend renders bubble + quick replies.
  return NextResponse.json({
    kind: "turn",
    scenarioId: scenario.id,
    turn,
  });
}

async function classifyIntent(text: string): Promise<string> {
  const completion = await llm().chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: INTENT_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0,
    max_tokens: 50,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = z
    .object({
      intent: z.enum([
        "PREGNANCY_SCARE",
        "MENTAL_HEALTH",
        "STD_PANIC",
        "GENERAL_SICK",
        "EMERGENCY",
      ]),
    })
    .safeParse(JSON.parse(raw));
  if (!parsed.success) return "GENERAL_SICK";
  return parsed.data.intent;
}

export async function GET() {
  // Used by /admin to introspect available scenarios.
  return NextResponse.json({
    scenarios: listScenarios().map((s) => ({ id: s.id, label: s.label })),
  });
}
