import { NextResponse } from "next/server";
import { z } from "zod";
import { runPipeline } from "@/lib/pipeline";
import { liveLlm } from "@/lib/llm/steps";

export const maxDuration = 60;

const Body = z.object({
  description: z.string().trim().min(1).max(600),
  budgetUsd: z.number().min(500).max(10_000_000).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Description must be 1–600 characters; budget at least $500." }, { status: 400 });
  try {
    return NextResponse.json(await runPipeline(parsed.data, liveLlm));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Pipeline failed" }, { status: 500 });
  }
}
