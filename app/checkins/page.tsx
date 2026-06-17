import { BookOpenCheck, Plus } from "lucide-react";
import { CheckInCard } from "@/components/checkins/CheckInCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import type { CheckInWithCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CheckInsPage() {
  const checkIns = (await prisma.checkIn.findMany({
    include: { category: true },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }],
  })) as CheckInWithCategory[];

  return (
    <>
      <PageHeader
        title="学习记录"
        description="按日期倒序查看所有打卡内容，快速回顾近期学习重点。"
        action={
          <ButtonLink href="/checkins/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建打卡
          </ButtonLink>
        }
      />

      {checkIns.length === 0 ? (
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
      ) : (
        <div className="grid gap-4">
          {checkIns.map((checkIn) => (
            <CheckInCard key={checkIn.id} checkIn={checkIn} />
          ))}
        </div>
      )}
    </>
  );
}
