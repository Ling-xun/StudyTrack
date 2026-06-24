import { NextResponse } from "next/server";
import { AI_MODES } from "@/lib/ai";
import { listSummaries } from "@/lib/ai-history";

const scopeTypes = ["current", "category", "recent_days", "date_range", "all"];

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode")?.trim() || undefined;
  const scopeType = searchParams.get("scopeType")?.trim() || undefined;
  if (mode && !AI_MODES.includes(mode as (typeof AI_MODES)[number])) {
    return NextResponse.json({ message: "不支持的分析类型" }, { status: 400 });
  }
  if (scopeType && !scopeTypes.includes(scopeType)) {
    return NextResponse.json({ message: "不支持的记录范围" }, { status: 400 });
  }
  return NextResponse.json(await listSummaries({
    mode,
    scopeType,
    page: positiveInteger(searchParams.get("page"), 1, 100_000),
    pageSize: positiveInteger(searchParams.get("pageSize"), 20, 50),
  }));
}
