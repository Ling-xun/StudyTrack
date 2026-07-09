import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateCategoryPayload, type CategoryPayload } from "@/lib/validation";

function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { checkIns: { where: { isDraft: false } } },
      },
    },
  });

  return NextResponse.json(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      checkInCount: category._count.checkIns,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })),
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CategoryPayload;
    const result = validateCategoryPayload(body);

    if ("message" in result) {
      return error(result.message ?? "参数错误");
    }

    const category = await prisma.category.create({
      data: result.data,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return error("分类名称已存在", 409);
    }

    return error("创建分类失败，请稍后再试", 500);
  }
}
