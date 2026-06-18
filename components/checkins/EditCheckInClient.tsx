"use client";

import { CheckInForm } from "@/components/checkins/CheckInForm";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { BookOpenCheck } from "lucide-react";
import { useCategoryOptions, useCheckIn } from "@/lib/queries";

export function EditCheckInClient({ id }: { id: string }) {
  const checkInQuery = useCheckIn(id);
  const categoriesQuery = useCategoryOptions();
  const isLoading = (!checkInQuery.data && checkInQuery.isLoading) || (!categoriesQuery.data && categoriesQuery.isLoading);

  return (
    <>
      <PageHeader
        title="编辑学习打卡"
        description="调整学习内容、分类、日期和时长，保存后会同步更新统计数据。"
      />
      {isLoading ? (
        <Card className="max-w-3xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-64 w-full" />
        </Card>
      ) : categoriesQuery.error ? (
        <QueryErrorState title="分类列表暂时不可用" />
      ) : checkInQuery.error ? (
        <EmptyState icon={BookOpenCheck} title="记录不存在" description="这条学习记录可能已经被删除，或链接地址有误。" />
      ) : (
        <CheckInForm categories={categoriesQuery.data ?? []} initialData={checkInQuery.data} mode="edit" />
      )}
    </>
  );
}
