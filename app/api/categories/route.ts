import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      color?: string;
      icon?: string;
    };

    const name = body.name?.trim();
    const color = body.color?.trim() || "#3B82F6";
    const icon = body.icon?.trim() || "BookOpen";

    if (!name) {
      return error("分类名称不能为空");
    }

    if (name.length > 20) {
      return error("分类名称不能超过 20 个字符");
    }

    const category = await prisma.category.create({
      data: { name, color, icon },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return error("分类名称已存在");
    }

    return error("创建分类失败，请稍后再试", 500);
  }
}
