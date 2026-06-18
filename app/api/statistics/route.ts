import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStudyStatistics } from "@/lib/statistics";
import type { CheckInWithCategory } from "@/lib/types";

export async function GET() {
  const checkIns = (await prisma.checkIn.findMany({
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
  })) as CheckInWithCategory[];

  return NextResponse.json(calculateStudyStatistics(checkIns));
}
