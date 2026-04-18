import { NextResponse } from "next/server";

import { getScenario } from "@/lib/scenarios/loader";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(scenario);
}
