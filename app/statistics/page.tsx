import { BarChart3, BookOpenCheck, CalendarCheck, Clock, Trophy } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryDurationList } from "@/components/statistics/CategoryDurationList";
import { SevenDayDurationChart } from "@/components/statistics/SevenDayDurationChart";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { prisma } from "@/lib/prisma";
import { calculateStudyStatistics, formatDuration } from "@/lib/statistics";
import { formatDate } from "@/lib/date";
import type { CheckInWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const checkIns = (await prisma.checkIn.findMany({
    include: { category: true },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
  })) as CheckInWithCategory[];
  const statistics = calculateStudyStatistics(checkIns);

  return (
    <>
      <PageHeader title="数据统计" description="查看学习时长、打卡天数和分类投入分布。" />

      {statistics.totalCheckInCount === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="还没有足够的数据"
          description="完成几次学习打卡后，这里会展示你的学习统计。"
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="总学习时长" value={formatDuration(statistics.totalDuration)} detail="所有记录累计" icon={Clock} tone="teal" />
            <StatCard title="总打卡天数" value={`${statistics.totalCheckInDays} 天`} detail="按学习日期去重" icon={CalendarCheck} tone="amber" />
            <StatCard title="总记录数" value={`${statistics.totalCheckInCount} 条`} detail="全部学习记录" icon={BookOpenCheck} tone="rose" />
            <StatCard title="平均每日学习" value={formatDuration(statistics.averageDurationPerDay)} detail="按打卡天数计算" icon={Trophy} tone="indigo" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <h2 className="text-lg font-bold text-slate-950">最近 7 天学习趋势</h2>
              <p className="mt-1 text-sm text-slate-500">单位：分钟</p>
              <div className="mt-5">
                <SevenDayDurationChart data={statistics.recentSevenDays} />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-slate-950">分类学习时长占比</h2>
              <p className="mt-1 text-sm text-slate-500">按分类累计学习时长</p>
              <div className="mt-5">
                <CategoryDurationList data={statistics.categoryDurations} />
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-lg font-bold text-slate-950">学习最多的分类</h2>
              <p className="mt-3 text-3xl font-bold text-slate-950">
                {statistics.topCategory?.name ?? "暂无"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {statistics.topCategory ? formatDuration(statistics.topCategory.duration) : "完成打卡后生成"}
              </p>
            </Card>
            <Card>
              <h2 className="text-lg font-bold text-slate-950">最近一次打卡</h2>
              <p className="mt-3 text-2xl font-bold text-slate-950">
                {statistics.latestCheckIn?.title ?? "暂无"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {statistics.latestCheckIn ? formatDate(statistics.latestCheckIn.studyDate) : "完成打卡后生成"}
              </p>
            </Card>
          </section>
        </div>
      )}
    </>
  );
}
