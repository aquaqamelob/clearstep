"use client";

import {
  AlertTriangle,
  Brain,
  Database,
  GitBranch,
  MessageSquare,
  Shield,
  Sparkles,
  Stethoscope,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { ScenarioMeta } from "@/lib/scenarios/types";

/**
 * n8n-style read-only flow visualization of a scenario.
 *
 * Pure SVG + absolutely positioned divs. No graph library. Layout is
 * deterministic — node positions computed from scenario data shape.
 *
 * Nodes are static (decorative). The point is to make the deterministic
 * pipeline visible: input → safety filter → LLM interview (N facts) →
 * decision engine → K branches.
 */

type NodeKind =
  | "trigger"
  | "safety"
  | "intent"
  | "llm"
  | "fact"
  | "router"
  | "decision"
  | "emergency";

type FlowNode = {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: string;
};

type Edge = {
  from: string;
  to: string;
  label?: string;
  /** Side of source node to exit from. */
  fromSide?: "right" | "bottom";
  /** Side of target node to enter on. */
  toSide?: "left" | "top";
  variant?: "default" | "safety" | "decision";
};

const KIND_STYLES: Record<
  NodeKind,
  {
    border: string;
    icon: string;
    iconBg: string;
    badge: string;
    Icon: typeof MessageSquare;
    label: string;
  }
> = {
  trigger: {
    border: "border-l-sky-500",
    icon: "text-sky-700",
    iconBg: "bg-sky-50",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    Icon: MessageSquare,
    label: "Trigger",
  },
  safety: {
    border: "border-l-red-500",
    icon: "text-red-700",
    iconBg: "bg-red-50",
    badge: "bg-red-50 text-red-700 border-red-200",
    Icon: Shield,
    label: "Safety filter",
  },
  intent: {
    border: "border-l-violet-500",
    icon: "text-violet-700",
    iconBg: "bg-violet-50",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    Icon: GitBranch,
    label: "Classifier",
  },
  llm: {
    border: "border-l-amber-500",
    icon: "text-amber-700",
    iconBg: "bg-amber-50",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Brain,
    label: "LLM",
  },
  fact: {
    border: "border-l-amber-300",
    icon: "text-amber-700",
    iconBg: "bg-amber-50/60",
    badge: "bg-foreground/5 text-foreground/70 border-foreground/10",
    Icon: Database,
    label: "Fact",
  },
  router: {
    border: "border-l-emerald-500",
    icon: "text-emerald-700",
    iconBg: "bg-emerald-50",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: Workflow,
    label: "Decision engine",
  },
  decision: {
    border: "border-l-emerald-400",
    icon: "text-emerald-700",
    iconBg: "bg-emerald-50/60",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: Stethoscope,
    label: "Decision",
  },
  emergency: {
    border: "border-l-red-500",
    icon: "text-red-700",
    iconBg: "bg-red-50",
    badge: "bg-red-50 text-red-700 border-red-200",
    Icon: AlertTriangle,
    label: "Escalation",
  },
};

const URGENCY_COLOR: Record<string, string> = {
  EMERGENCY: "bg-red-50 text-red-700 border-red-200",
  URGENT: "bg-red-50 text-red-700 border-red-200",
  SOON: "bg-amber-50 text-amber-700 border-amber-200",
  ROUTINE: "bg-foreground/5 text-foreground/60 border-foreground/10",
};

const NODE_W = 240;
const FACT_NODE_H = 56;
const NODE_H = 92;

/** Builds a smooth horizontal bezier between two anchor points. */
function bezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fromSide: Edge["fromSide"] = "right",
  toSide: Edge["toSide"] = "left"
): string {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const k = Math.max(40, Math.min(140, dx * 0.45 + dy * 0.15));
  const cp1x = fromSide === "right" ? x1 + k : x1;
  const cp1y = fromSide === "right" ? y1 : y1 + k;
  const cp2x = toSide === "left" ? x2 - k : x2;
  const cp2y = toSide === "left" ? y2 : y2 - k;
  return `M ${x1} ${y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
}

function buildLayout(scenario: ScenarioMeta) {
  const facts = scenario.factSchema;
  const decisions = scenario.decisions;

  // Column anchors
  const COL_X = {
    trigger: 40,
    safety: 40,
    intent: 320,
    llm: 580,
    router: 980,
    decision: 1240,
  } as const;

  // Compute LLM container height based on fact count
  const llmHeaderH = 56;
  const llmInnerGap = 8;
  const llmInnerPadTop = 56;
  const llmInnerPadBottom = 16;
  const llmH =
    llmInnerPadTop +
    facts.length * FACT_NODE_H +
    Math.max(0, facts.length - 1) * llmInnerGap +
    llmInnerPadBottom;

  // Vertical center of the diagram
  const vCenter = Math.max(360, llmH / 2 + 80);

  // Decisions stacked vertically, centered around vCenter
  const decisionGap = 12;
  const decisionsH = decisions.length * NODE_H + (decisions.length - 1) * decisionGap;
  const decisionStartY = vCenter - decisionsH / 2;

  const nodes: FlowNode[] = [];
  const edges: Edge[] = [];

  // 1. Trigger (user input)
  nodes.push({
    id: "trigger",
    kind: "trigger",
    x: COL_X.trigger,
    y: vCenter - NODE_H / 2,
    w: NODE_W,
    h: NODE_H,
    title: "User message",
    subtitle: "POST /api/chat",
    meta: "first turn",
  });

  // 2. Safety filter (always-on, parallel)
  nodes.push({
    id: "safety",
    kind: "safety",
    x: COL_X.trigger,
    y: 40,
    w: NODE_W,
    h: NODE_H,
    title: "Red-flag pre-filter",
    subtitle: "lib/safety.ts",
    badge: "deterministic",
    meta: "every turn",
  });

  // 3. Intent classifier (LLM + rule shortcut)
  nodes.push({
    id: "intent",
    kind: "intent",
    x: COL_X.intent,
    y: vCenter - NODE_H / 2,
    w: NODE_W,
    h: NODE_H,
    title: "Intent classifier",
    subtitle: "LLM + PL slang rules",
    badge: scenario.id,
    meta: "5 intents",
  });

  // 4. LLM interview container
  nodes.push({
    id: "llm",
    kind: "llm",
    x: COL_X.llm,
    y: vCenter - llmH / 2,
    w: NODE_W + 60,
    h: llmH,
    title: "LLM interview loop",
    subtitle: "JSON-schema validated",
    badge: `${facts.length} facts`,
    meta: "no diagnosis",
  });

  // 5. Fact nodes (vertical chain inside LLM container)
  let factY = vCenter - llmH / 2 + llmInnerPadTop;
  facts.forEach((f, i) => {
    nodes.push({
      id: `fact-${f.key}`,
      kind: "fact",
      x: COL_X.llm + 16,
      y: factY,
      w: NODE_W + 28,
      h: FACT_NODE_H,
      title: f.label,
      subtitle: f.key,
      badge: f.required ? "required" : "optional",
      meta: f.type,
    });
    if (i > 0) {
      edges.push({
        from: `fact-${facts[i - 1].key}`,
        to: `fact-${f.key}`,
        fromSide: "bottom",
        toSide: "top",
      });
    }
    factY += FACT_NODE_H + llmInnerGap;
  });

  // 6. Decision router
  nodes.push({
    id: "router",
    kind: "router",
    x: COL_X.router,
    y: vCenter - NODE_H / 2,
    w: NODE_W,
    h: NODE_H,
    title: "Decision engine",
    subtitle: "lib/scenarios/decide.ts",
    badge: `${scenario.rules.length} rules`,
    meta: "deterministic TS",
  });

  // 7. Decisions (parallel branches)
  decisions.forEach((d, i) => {
    nodes.push({
      id: `dec-${d.id}`,
      kind: "decision",
      x: COL_X.decision,
      y: decisionStartY + i * (NODE_H + decisionGap),
      w: NODE_W,
      h: NODE_H,
      title: d.title,
      subtitle: d.id,
      badge: d.urgency,
      meta: d.specialist,
    });
    edges.push({
      from: "router",
      to: `dec-${d.id}`,
      variant: "decision",
    });
  });

  // Backbone edges
  edges.push({ from: "trigger", to: "intent" });
  edges.push({ from: "intent", to: "llm" });
  edges.push({ from: "llm", to: "router", label: "ready_for_decision" });
  edges.push({
    from: "safety",
    to: "intent",
    variant: "safety",
    label: "bypass on red flag",
  });

  // Compute canvas dimensions
  const canvasW = COL_X.decision + NODE_W + 80;
  const canvasH = Math.max(vCenter * 2, llmH + 160, decisionsH + 200) + 80;

  // Suppress llmHeaderH "unused" by acknowledging it's reserved for future
  // header chip rendering inside the LLM container.
  void llmHeaderH;

  return { nodes, edges, canvasW, canvasH };
}

/** Anchor coordinates for an edge endpoint. */
function anchor(node: FlowNode, side: "right" | "left" | "top" | "bottom") {
  switch (side) {
    case "right":
      return { x: node.x + node.w, y: node.y + node.h / 2 };
    case "left":
      return { x: node.x, y: node.y + node.h / 2 };
    case "top":
      return { x: node.x + node.w / 2, y: node.y };
    case "bottom":
      return { x: node.x + node.w / 2, y: node.y + node.h };
  }
}

export function FlowView({ scenario }: { scenario: ScenarioMeta }) {
  const [zoom, setZoom] = useState(1);
  const { nodes, edges, canvasW, canvasH } = useMemo(
    () => buildLayout(scenario),
    [scenario]
  );

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  return (
    <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-foreground/10 px-3 py-2 bg-foreground/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-foreground/70 font-medium">
            Flow active
          </span>
          <span className="text-xs text-foreground/40 ml-2 font-mono">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="h-7 w-7 rounded-md text-foreground/60 hover:bg-foreground/5 text-sm font-medium"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-xs text-foreground/60 font-mono w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="h-7 w-7 rounded-md text-foreground/60 hover:bg-foreground/5 text-sm font-medium"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="h-7 px-2 rounded-md text-foreground/60 hover:bg-foreground/5 text-[11px] font-medium"
          >
            Fit
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative overflow-auto bg-[radial-gradient(circle,_rgba(0,0,0,0.06)_1px,_transparent_1px)] [background-size:20px_20px] [background-position:0_0]">
        <div
          className="relative"
          style={{
            width: canvasW * zoom,
            height: canvasH * zoom,
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: canvasW,
              height: canvasH,
              position: "relative",
            }}
          >
            {/* Edges layer */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasW}
              height={canvasH}
            >
              <defs>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                </marker>
                <marker
                  id="arrow-safety"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
                </marker>
                <marker
                  id="arrow-decision"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
              </defs>

              {edges.map((e, i) => {
                const from = nodeMap[e.from];
                const to = nodeMap[e.to];
                if (!from || !to) return null;
                const fromAnchor = anchor(from, e.fromSide ?? "right");
                const toAnchor = anchor(to, e.toSide ?? "left");
                const stroke =
                  e.variant === "safety"
                    ? "#dc2626"
                    : e.variant === "decision"
                      ? "#10b981"
                      : "#94a3b8";
                const marker =
                  e.variant === "safety"
                    ? "url(#arrow-safety)"
                    : e.variant === "decision"
                      ? "url(#arrow-decision)"
                      : "url(#arrow-default)";
                const dash = e.variant === "safety" ? "6 4" : undefined;
                const d = bezierPath(
                  fromAnchor.x,
                  fromAnchor.y,
                  toAnchor.x,
                  toAnchor.y,
                  e.fromSide,
                  e.toSide
                );
                const midX = (fromAnchor.x + toAnchor.x) / 2;
                const midY = (fromAnchor.y + toAnchor.y) / 2 - 8;
                return (
                  <g key={i}>
                    <path
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={1.5}
                      strokeDasharray={dash}
                      markerEnd={marker}
                      opacity={0.9}
                    />
                    {e.label && (
                      <g>
                        <rect
                          x={midX - e.label.length * 3.2}
                          y={midY - 9}
                          width={e.label.length * 6.4}
                          height={16}
                          rx={3}
                          fill="white"
                          stroke="#e5e7eb"
                          strokeWidth={1}
                        />
                        <text
                          x={midX}
                          y={midY + 2}
                          fontSize={10}
                          textAnchor="middle"
                          fill="#475569"
                          fontFamily="ui-monospace, monospace"
                        >
                          {e.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes layer */}
            {nodes.map((n) => (
              <NodeCard key={n.id} node={n} />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-foreground/10 px-3 py-2 bg-foreground/[0.02] flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-foreground/60">
        <LegendDot color="bg-sky-500" label="Trigger" />
        <LegendDot color="bg-red-500" label="Safety / Emergency" />
        <LegendDot color="bg-violet-500" label="Classifier" />
        <LegendDot color="bg-amber-500" label="LLM (interview)" />
        <LegendDot color="bg-emerald-500" label="Deterministic engine" />
        <span className="ml-auto font-mono text-foreground/40">
          read-only · n8n-style
        </span>
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: FlowNode }) {
  const s = KIND_STYLES[node.kind];
  const isContainer = node.kind === "llm";
  return (
    <div
      className={`absolute rounded-lg bg-white border border-foreground/10 border-l-4 ${s.border} ${
        isContainer ? "shadow-none" : "shadow-sm"
      } overflow-hidden`}
      style={{
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
      }}
    >
      <div className="flex items-start gap-2 p-2.5">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${s.iconBg}`}
        >
          <s.Icon className={`h-3.5 w-3.5 ${s.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/40">
              {s.label}
            </span>
            {node.badge && (
              <span
                className={`text-[9px] px-1 py-px rounded border font-medium ${
                  node.kind === "decision"
                    ? URGENCY_COLOR[node.badge] ?? s.badge
                    : s.badge
                }`}
              >
                {node.badge}
              </span>
            )}
          </div>
          <p className="text-[12px] font-medium text-foreground leading-tight mt-0.5 truncate">
            {node.title}
          </p>
          {node.subtitle && (
            <p className="text-[10px] text-foreground/50 font-mono mt-0.5 truncate">
              {node.subtitle}
            </p>
          )}
          {node.meta && !isContainer && node.kind !== "fact" && (
            <p className="text-[10px] text-foreground/40 mt-0.5 truncate">
              {node.meta}
            </p>
          )}
        </div>
      </div>

      {isContainer && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-600" />
          <span className="text-[9px] font-medium text-amber-700 uppercase tracking-wide">
            llama 3.3
          </span>
        </div>
      )}

      {/* Port dots */}
      {node.kind !== "fact" && (
        <>
          <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-foreground/20 ring-2 ring-card" />
          <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-foreground/20 ring-2 ring-card" />
        </>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
