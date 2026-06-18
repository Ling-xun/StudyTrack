"use client";

import { BookCheck, CalendarCheck, Clock, Flame, Plus, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentCheckInList } from "@/components/dashboard/RecentCheckInList";
import { SevenDayDurationChart } from "@/components/statistics/SevenDayDurationChart";
import { Card } from "@/components/ui/card";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { useCheckIns, useStatistics } from "@/lib/queries";
import { formatDuration } from "@/lib/statistics";

function StatGridSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-3 h-4 w-28" />
        </Card>
      ))}
    </section>
  );
}

function RecentSkeleton() {
  return (
    <Card>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-2 h-4 w-44" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function DashboardClient() {
  const statisticsQuery = useStatistics();
  const recentQuery = useCheckIns({ limit: 5 });
  const statistics = statisticsQuery.data;
  const recentCheckIns = recentQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="今天也在往前走"
        description="记录每天学了什么，回头看时会发现进步已经有迹可循。"
        action={
          <ButtonLink href="/checkins/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建打卡
          </ButtonLink>
        }
      />

      {!statistics && statisticsQuery.isError ? (
        <QueryErrorState />
      ) : !statistics ? (
        <StatGridSkeleton />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="今日学习"
            value={`${statistics.todayMinutes} 分钟`}
            detail={statistics.checkedToday ? "今天已打卡" : "今天还未打卡"}
            icon={Clock}
            tone="teal"
          />
          <StatCard title="本周累计" value={`${statistics.weekMinutes} 分钟`} detail="按自然周统计" icon={Flame} tone="amber" />
          <StatCard title="打卡天数" value={`${statistics.totalCheckInDays} 天`} detail="有记录的日期数量" icon={CalendarCheck} tone="rose" />
          <StatCard title="总学习时长" value={`${statistics.totalDuration} 分钟`} detail="所有记录累计" icon={BookCheck} tone="indigo" />
          <StatCard
            title="平均每日学习"
            value={formatDuration(statistics.averageDurationPerDay)}
            detail="按打卡天数计算"
            icon={Clock}
            tone="teal"
          />
          <StatCard
            title="学习最多分类"
            value={statistics.topCategory?.name ?? "暂无"}
            detail={statistics.topCategory ? formatDuration(statistics.topCategory.duration) : "完成打卡后生成"}
            icon={Trophy}
            tone="amber"
          />
        </section>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">最近 7 天学习趋势</h2>
          <p className="mt-1 text-sm text-slate-500">快速看看最近一周的学习节奏。</p>
          <div className="mt-5">
            {statisticsQuery.isError && !statistics ? (
              <QueryErrorState title="趋势数据暂时不可用" />
            ) : statistics ? (
              <SevenDayDurationChart data={statistics.recentSevenDays} />
            ) : (
              <Skeleton className="h-52 w-full" />
            )}
          </div>
        </Card>
        {!recentQuery.data && recentQuery.isError ? (
          <QueryErrorState title="最近记录暂时不可用" />
        ) : !recentQuery.data && recentQuery.isLoading ? (
          <RecentSkeleton />
        ) : (
          <RecentCheckInList checkIns={recentCheckIns} />
        )}
      </section>
    </>
  );
}
