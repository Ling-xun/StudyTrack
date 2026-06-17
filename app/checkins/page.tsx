import { BookOpenCheck, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import { CheckInFilterBar } from "@/components/checkins/CheckInFilterBar";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { parseStudyDate } from "@/lib/validation";
import type { CheckInWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CheckInsPage({
  searchParams,
}: {
  searchParams: Promise<{
    keyword?: string;
    categoryId?: string;
    date?: string;
  }>;
}) {
  const params = await searchParams;
  const keyword = params.keyword?.trim() ?? "";
  const categoryId = params.categoryId?.trim() ?? "";
  const date = params.date?.trim() ?? "";
  const where: Prisma.CheckInWhereInput = {};

  if (keyword) {
    where.OR = [{ title: { contains: keyword } }, { content: { contains: keyword } }];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (date) {
    const parsedDate = parseStudyDate(date);

    if (parsedDate) {
      where.studyDate = parsedDate;
    }
  }

  const [checkIns, categories] = await Promise.all([
    prisma.checkIn.findMany({
      where,
    include: { category: true },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
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

  const hasFilters = Boolean(keyword || categoryId || date);

  return (
    <>
      <PageHeader
        title="学习记录"
        description="查看、搜索和管理你的学习打卡内容。"
        action={
          <ButtonLink href="/checkins/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建打卡
          </ButtonLink>
        }
      />

      <CheckInFilterBar
        categories={categories}
        keyword={keyword}
        categoryId={categoryId}
        date={date}
      />

      {checkIns.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title={hasFilters ? "没有找到匹配的学习记录" : "还没有学习记录"}
          description={hasFilters ? "试试换个关键词，或者清空筛选条件。" : "点击新建打卡，记录今天学了什么。"}
          action={
            hasFilters ? (
              <ButtonLink href="/checkins" variant="secondary">
                清空筛选
              </ButtonLink>
            ) : (
              <ButtonLink href="/checkins/new">新建打卡</ButtonLink>
            )
          }
        />
      ) : (
        <div className="grid gap-4">
          {checkIns.map((checkIn) => (
            <CheckInCard key={checkIn.id} checkIn={checkIn as CheckInWithCategory} />
          ))}
        </div>
      )}
    </>
  );
}
