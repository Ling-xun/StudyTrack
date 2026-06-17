import { BookCheck, CalendarCheck, Clock, Flame, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentCheckInList } from "@/components/dashboard/RecentCheckInList";
import { prisma } from "@/lib/prisma";
import { isThisWeek, isToday, formatDate } from "@/lib/date";
import type { CheckInWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const checkIns = (await prisma.checkIn.findMany({
    include: { category: true },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
  })) as CheckInWithCategory[];

  const todayMinutes = checkIns
    .filter((checkIn) => isToday(checkIn.studyDate))
    .reduce((sum, checkIn) => sum + checkIn.duration, 0);

  const weekMinutes = checkIns
    .filter((checkIn) => isThisWeek(checkIn.studyDate))
    .reduce((sum, checkIn) => sum + checkIn.duration, 0);

  const totalMinutes = checkIns.reduce((sum, checkIn) => sum + checkIn.duration, 0);
  const totalDays = new Set(checkIns.map((checkIn) => formatDate(checkIn.studyDate))).size;
  const checkedToday = todayMinutes > 0;

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="今日学习"
          value={`${todayMinutes} 分钟`}
          detail={checkedToday ? "今天已打卡" : "今天还未打卡"}
          icon={Clock}
          tone="teal"
        />
        <StatCard title="本周累计" value={`${weekMinutes} 分钟`} detail="按自然周统计" icon={Flame} tone="amber" />
        <StatCard title="打卡天数" value={`${totalDays} 天`} detail="有记录的日期数量" icon={CalendarCheck} tone="rose" />
        <StatCard title="总学习时长" value={`${totalMinutes} 分钟`} detail="所有记录累计" icon={BookCheck} tone="indigo" />
      </section>

      <section className="mt-6">
        <RecentCheckInList checkIns={checkIns.slice(0, 5)} />
      </section>
    </>
  );
}
