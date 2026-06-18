"use client";

import { CheckInForm } from "@/components/checkins/CheckInForm";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { useCategoryOptions } from "@/lib/queries";

export function NewCheckInClient() {
  const categoriesQuery = useCategoryOptions();

  return (
    <>
      <PageHeader
        title="新建学习打卡"
        description="写下学习主题、分类、时长和具体内容，把今天的进度稳稳存下来。"
      />
      {!categoriesQuery.data && categoriesQuery.isError ? (
        <QueryErrorState title="分类列表暂时不可用" />
      ) : !categoriesQuery.data && categoriesQuery.isLoading ? (
        <Card className="max-w-3xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-64 w-full" />
        </Card>
      ) : (
        <CheckInForm categories={categoriesQuery.data ?? []} />
      )}
    </>
  );
}
