import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { deleteSummary, getSummary } from "@/lib/ai-history";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const summary = await getSummary((await context.params).id);
  return summary
    ? NextResponse.json(summary)
    : NextResponse.json({ message: "总结记录不存在" }, { status: 404 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await deleteSummary((await context.params).id);
    return NextResponse.json({ message: "总结已删除" });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2025") {
      return NextResponse.json({ message: "总结记录不存在" }, { status: 404 });
    }
    return NextResponse.json({ message: "删除总结失败，请稍后再试" }, { status: 500 });
  }
}
