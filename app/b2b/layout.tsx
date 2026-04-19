import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2B · Mapa popytu — Podkarpacie",
  description:
    "Heatmapa popytu vs. podaży placówek dla Podkarpacia. Analiza dla Luxmed i partnerów: gdzie postawić kolejną placówkę.",
};

/**
 * Isolated shell for the B2B dashboard. The root <body> uses
 * `min-h-full flex flex-col` to support the chat app's full-bleed layout.
 * Shadcn's SidebarProvider expects a normal block container so its
 * own `flex min-h-svh w-full` shell can take over the viewport. We wrap
 * children in a w-full block to neutralise the body flex constraints.
 */
export default function B2BLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
