import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { deleteConversation, getConversation } from "@/lib/ai-history";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const conversation = await getConversation((await context.params).id);
  return conversation
    ? NextResponse.json(conversation)
    : NextResponse.json({ message: "对话不存在" }, { status: 404 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await deleteConversation((await context.params).id);
    return NextResponse.json({ message: "对话已删除" });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2025") {
      return NextResponse.json({ message: "对话不存在" }, { status: 404 });
    }
    return NextResponse.json({ message: "删除对话失败，请稍后再试" }, { status: 500 });
  }
}
