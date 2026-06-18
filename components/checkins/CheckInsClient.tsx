"use client";

import { BookOpenCheck, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import { CheckInFilterBar } from "@/components/checkins/CheckInFilterBar";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_CHECKIN_LIMIT, useCategories, useInfiniteCheckIns } from "@/lib/queries";

function CheckInListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-4 w-72 max-w-full" />
          <Skeleton className="mt-5 h-10 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function CheckInsClient() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId")?.trim() ?? "";
  const date = searchParams.get("date")?.trim() ?? "";
  const categoriesQuery = useCategories();
  const checkInsQuery = useInfiniteCheckIns({ keyword, categoryId, date, limit: DEFAULT_CHECKIN_LIMIT });
  const categories = categoriesQuery.data ?? [];
  const pages = checkInsQuery.data?.pages ?? [];
  const checkIns = pages.flatMap((page) => page.items);
  const total = pages[0]?.total ?? 0;
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

      <CheckInFilterBar categories={categories} keyword={keyword} categoryId={categoryId} date={date} />

      {!checkInsQuery.data && checkInsQuery.isError ? (
        <QueryErrorState title="学习记录暂时不可用" />
      ) : !checkInsQuery.data && checkInsQuery.isLoading ? (
        <CheckInListSkeleton />
      ) : checkIns.length === 0 ? (
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
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span>已显示 {checkIns.length} / {total} 条</span>
            {checkInsQuery.isFetching ? <span>更新中...</span> : null}
          </div>
          {checkIns.map((checkIn) => (
            <CheckInCard key={checkIn.id} checkIn={checkIn} />
          ))}
          {checkInsQuery.hasNextPage ? (
            <Button
              type="button"
              variant="secondary"
              className="justify-self-center"
              disabled={checkInsQuery.isFetchingNextPage}
              onClick={() => checkInsQuery.fetchNextPage()}
            >
              {checkInsQuery.isFetchingNextPage ? "加载中..." : "加载更多"}
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}
