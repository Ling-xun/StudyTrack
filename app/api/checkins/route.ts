import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseStudyDate, validateCheckInPayload, type CheckInPayload } from "@/lib/validation";

function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim();
  const date = searchParams.get("date")?.trim();
  const parsedLimit = Number(searchParams.get("limit") ?? 20);
  const parsedOffset = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50) : 20;
  const offset = Number.isFinite(parsedOffset) ? Math.max(Math.floor(parsedOffset), 0) : 0;
  const where: Prisma.CheckInWhereInput = {};

  if (keyword) {
    where.OR = [{ title: { contains: keyword } }, { content: { contains: keyword } }];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (date) {
    const parsedDate = parseStudyDate(date);

    if (!parsedDate) {
      return error("日期格式不正确");
    }

    where.studyDate = parsedDate;
  }

  const [checkIns, total] = await Promise.all([
    prisma.checkIn.findMany({
      where,
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        studyDate: true,
        duration: true,
        mood: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.checkIn.count({ where }),
  ]);

  return NextResponse.json({
    items: checkIns,
    total,
    limit,
    offset,
    nextOffset: offset + checkIns.length < total ? offset + checkIns.length : null,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckInPayload;
    const result = await validateCheckInPayload(body);

    if ("message" in result) {
      return error(result.message ?? "参数错误");
    }

    const checkIn = await prisma.checkIn.create({
      data: result.data,
      include: { category: true },
    });

    return NextResponse.json(checkIn, { status: 201 });
  } catch {
    return error("创建学习记录失败，请稍后再试", 500);
  }
}
