import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const checkIns = await prisma.checkIn.findMany({
    include: { category: true },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(checkIns);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      studyDate?: string;
      duration?: number | string;
      mood?: string;
      categoryId?: string;
    };

    const title = body.title?.trim();
    const content = body.content?.trim();
    const categoryId = body.categoryId?.trim();
    const studyDate = body.studyDate?.trim();
    const duration = Number(body.duration);
    const mood = body.mood?.trim() || null;

    if (!title) {
      return error("学习标题不能为空");
    }

    if (title.length > 50) {
      return error("学习标题不能超过 50 个字符");
    }

    if (!categoryId) {
      return error("请选择学习分类");
    }

    if (!studyDate) {
      return error("学习日期不能为空");
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      return error("学习时长必须是大于 0 的整数");
    }

    if (!content) {
      return error("学习内容不能为空");
    }

    if (content.length > 1000) {
      return error("学习内容不能超过 1000 个字符");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return error("分类不存在");
    }

    const parsedDate = new Date(`${studyDate}T00:00:00.000`);

    if (Number.isNaN(parsedDate.getTime())) {
      return error("学习日期格式不正确");
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        title,
        content,
        studyDate: parsedDate,
        duration,
        mood,
        categoryId,
      },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch {
    return error("创建学习记录失败，请稍后再试", 500);
  }
}
