import { z } from "zod";

export const FactSpecSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["enum", "string", "number", "boolean"]),
  required: z.boolean().default(true),
  options: z.array(z.string()).optional(),
  hint: z.string().optional(),
});
export type FactSpec = z.infer<typeof FactSpecSchema>;

export const DecisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  urgency: z.enum(["EMERGENCY", "URGENT", "SOON", "ROUTINE"]),
  advice: z.string(),
  plan: z.array(z.string()),
  ctaLabel: z.string().default("Zarezerwuj wizytę"),
  specialist: z.string(),
  helplines: z.array(z.object({ name: z.string(), number: z.string() })).default([]),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const RuleSchema = z.object({
  when: z.string().describe("Human-readable condition (documentation only). The actual logic lives in code (decide.ts)."),
  decisionId: z.string(),
});
export type Rule = z.infer<typeof RuleSchema>;

export const ScenarioMetaSchema = z.object({
  id: z.enum(["PREGNANCY_SCARE", "MENTAL_HEALTH", "STD_PANIC", "GENERAL_SICK"]),
  label: z.string(),
  description: z.string(),
  sources: z.array(z.string()),
  greeting: z.string(),
  systemPrompt: z.string(),
  factSchema: z.array(FactSpecSchema),
  decisions: z.array(DecisionSchema),
  rules: z.array(RuleSchema),
});
export type ScenarioMeta = z.infer<typeof ScenarioMetaSchema>;

export type Intent = ScenarioMeta["id"] | "EMERGENCY";

export const ChatTurnSchema = z.object({
  message: z.string(),
  quick_replies: z.array(z.string()).default([]),
  facts_collected: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  ready_for_decision: z.boolean().default(false),
  escalate: z.enum(["EMERGENCY"]).nullable().default(null),
});
export type ChatTurn = z.infer<typeof ChatTurnSchema>;
