import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateCategoryPayload, type CategoryPayload } from "@/lib/validation";

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
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { checkIns: { where: { isDraft: false } } },
      },
    },
  });

  if (!category) {
    return error("分类不存在", 404);
  }

  return NextResponse.json({
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    checkInCount: category._count.checkIns,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  });
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const exists = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      return error("分类不存在", 404);
    }

    const body = (await request.json()) as CategoryPayload;
    const result = validateCategoryPayload(body);

    if ("message" in result) {
      return error(result.message ?? "参数错误");
    }

    const category = await prisma.category.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return error("分类名称已存在", 409);
    }

    return error("更新分类失败，请稍后再试", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { checkIns: true },
        },
      },
    });

    if (!category) {
      return error("分类不存在", 404);
    }

    if (category._count.checkIns > 0) {
      return error("该分类下还有学习记录，暂时不能删除", 400);
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch {
    return error("删除分类失败，请稍后再试", 500);
  }
}
