import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCheckInPayload, type CheckInPayload } from "@/lib/validation";

function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!checkIn) {
    return error("学习记录不存在", 404);
  }

  return NextResponse.json(checkIn);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const exists = await prisma.checkIn.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return error("学习记录不存在", 404);
    }

    const body = (await request.json()) as CheckInPayload;
    const result = await validateCheckInPayload(body);

    if ("message" in result) {
      return error(result.message ?? "参数错误");
    }

    const checkIn = await prisma.checkIn.update({
      where: { id },
      data: result.data,
      include: { category: true },
    });

    return NextResponse.json(checkIn);
  } catch {
    return error("更新学习记录失败，请稍后再试", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const exists = await prisma.checkIn.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return error("学习记录不存在", 404);
    }

    await prisma.checkIn.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch {
    return error("删除学习记录失败，请稍后再试", 500);
  }
}
