import { NextResponse } from "next/server";
import { z } from "zod";
import { runBaseline } from "@/lib/baseline";
import { DEFAULT_BUDGET_USD } from "@/lib/config";

export const maxDuration = 60;

const Body = z.object({ description: z.string().trim().min(1).max(600), budgetUsd: z.number().min(500).optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try {
    return NextResponse.json(await runBaseline(parsed.data.description, parsed.data.budgetUsd ?? DEFAULT_BUDGET_USD));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Baseline failed" }, { status: 500 });
  }
}
