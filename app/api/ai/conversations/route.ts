import { NextResponse } from "next/server";
import { listConversations } from "@/lib/ai-history";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(await listConversations(
    positiveInteger(searchParams.get("page"), 1, 100_000),
    positiveInteger(searchParams.get("pageSize"), 20, 50),
  ));
}
