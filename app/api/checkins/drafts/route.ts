import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const draft = await prisma.checkIn.findFirst({
    where: { isDraft: true },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(draft);
}
