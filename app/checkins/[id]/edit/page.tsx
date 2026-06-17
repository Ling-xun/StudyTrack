import { notFound } from "next/navigation";
import { CheckInForm } from "@/components/checkins/CheckInForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import type { CategorySummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditCheckInPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const [checkIn, categories] = await Promise.all([
    prisma.checkIn.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
      },
    }),
  ]);

  if (!checkIn) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="编辑学习打卡"
        description="调整学习内容、分类、日期和时长，保存后会同步更新统计数据。"
      />
      <CheckInForm categories={categories as CategorySummary[]} initialData={checkIn} mode="edit" />
    </>
  );
}
