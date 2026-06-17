import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStudyStatistics } from "@/lib/statistics";
import type { CheckInWithCategory } from "@/lib/types";

export async function GET() {
  const checkIns = (await prisma.checkIn.findMany({
    include: { category: true },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
  })) as CheckInWithCategory[];

  return NextResponse.json(calculateStudyStatistics(checkIns));
}
