import { BookOpenCheck, CalendarDays, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";
import { formatDate } from "@/lib/date";
import type { CheckInWithCategory } from "@/lib/types";

export function RecentCheckInList({ checkIns }: { checkIns: CheckInWithCategory[] }) {
  if (checkIns.length === 0) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <BookOpenCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-bold text-slate-950">还没有学习记录</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          点击新建打卡，记录今天学了什么。
        </p>
        <ButtonLink href="/checkins/new" className="mt-5">
          新建打卡
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">最近学习记录</h2>
          <p className="mt-1 text-sm text-slate-500">最近 5 条学习动态</p>
        </div>
        <ButtonLink href="/checkins" variant="secondary" className="h-9 px-3">
          查看全部
        </ButtonLink>
      </div>
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <article
            key={checkIn.id}
            className="rounded-lg border border-slate-100 bg-gradient-to-r from-white to-slate-50/80 p-4 transition hover:border-slate-200 hover:shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-950">{checkIn.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                    style={{ backgroundColor: checkIn.category.color, color: "#ffffff" }}
                  >
                    <CategoryIcon name={checkIn.category.icon} className="h-3.5 w-3.5" />
                    {checkIn.category.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {formatDate(checkIn.studyDate)}
                  </span>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold"
                style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                {checkIn.duration} 分钟
              </span>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
