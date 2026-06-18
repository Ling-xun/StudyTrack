"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, FileText, Smile } from "lucide-react";
import { CheckInDetailActions } from "@/components/checkins/CheckInDetailActions";
import { ImmersiveReader } from "@/components/checkins/ImmersiveReader";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useToast } from "@/components/common/ToastProvider";
import { CategoryIcon } from "@/lib/icons";
import { formatDate } from "@/lib/date";
import { invalidateCheckInData, queryKeys, requestJson, useCheckIn } from "@/lib/queries";
import type { CheckInWithCategory } from "@/lib/types";

function DetailMetaItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 min-w-0 text-sm font-bold text-slate-900 [overflow-wrap:anywhere] [word-break:break-word]">
        {children}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/checkins"
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      返回
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <BackLink />
      <article className="mt-5 overflow-hidden rounded-lg border border-white/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-5 h-9 w-3/4" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="mt-8 h-40 w-full" />
      </article>
    </div>
  );
}

export function RecordDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const checkInQuery = useCheckIn(id);
  const checkIn = checkInQuery.data;

  if (!checkIn && checkInQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (!checkIn) {
    return (
      <div className="mx-auto w-full max-w-[720px]">
        <BackLink />
        <div className="mt-5">
          <EmptyState title="记录不存在" description="这条学习记录可能已经被删除，或链接地址有误。" icon={FileText} />
        </div>
      </div>
    );
  }

  async function saveContent(content: string) {
    if (!checkIn) {
      return;
    }

    const updatedCheckIn = await requestJson<CheckInWithCategory>(`/api/checkins/${checkIn.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: checkIn.title,
        categoryId: checkIn.categoryId,
        studyDate: formatDate(checkIn.studyDate),
        duration: checkIn.duration,
        mood: checkIn.mood ?? "",
        content,
      }),
    });

    queryClient.setQueryData(queryKeys.checkIn(checkIn.id), updatedCheckIn);
    invalidateCheckInData(queryClient, checkIn.id);
    toast("阅读内容已保存");
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <BackLink />

      <article className="mt-5 overflow-hidden rounded-lg border border-white/80 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur">
        <header className="border-b border-slate-100 p-5 sm:p-6">
          <span
            className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ backgroundColor: checkIn.category.color, color: "#ffffff" }}
          >
            <CategoryIcon name={checkIn.category.icon} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{checkIn.category.name}</span>
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-normal text-slate-950 [overflow-wrap:anywhere] [word-break:break-word] sm:text-3xl">
            {checkIn.title}
          </h1>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailMetaItem icon={<FileText className="h-4 w-4" aria-hidden="true" />} label="分类">
              {checkIn.category.name}
            </DetailMetaItem>
            <DetailMetaItem icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />} label="日期">
              {formatDate(checkIn.studyDate)}
            </DetailMetaItem>
            <DetailMetaItem icon={<Smile className="h-4 w-4" aria-hidden="true" />} label="状态">
              {checkIn.mood || "未填写"}
            </DetailMetaItem>
            <DetailMetaItem icon={<Clock className="h-4 w-4" aria-hidden="true" />} label="学习时长">
              {checkIn.duration} 分钟
            </DetailMetaItem>
          </div>
        </header>

        <ImmersiveReader
          title={checkIn.title}
          content={checkIn.content}
          categoryName={checkIn.category.name}
          categoryColor={checkIn.category.color}
          editable
          onSaveContent={saveContent}
        />
      </article>

      <CheckInDetailActions checkInId={checkIn.id} />
    </div>
  );
}
