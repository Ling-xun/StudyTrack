import { CheckInForm } from "@/components/checkins/CheckInForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import type { CategorySummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewCheckInPage() {
  const categories = (await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
    },
  })) as CategorySummary[];

  return (
    <>
      <PageHeader
        title="新建学习打卡"
        description="写下学习主题、分类、时长和具体内容，把今天的进度稳稳存下来。"
      />
      <CheckInForm categories={categories} />
    </>
  );
}
