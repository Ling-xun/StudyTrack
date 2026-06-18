"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Clock, Pencil, Smile, Trash2 } from "lucide-react";
import { ImmersiveReader } from "@/components/checkins/ImmersiveReader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";
import { formatDate } from "@/lib/date";
import { invalidateCheckInData, queryKeys, requestJson } from "@/lib/queries";
import type { CheckInListItem, CheckInWithCategory } from "@/lib/types";

function CheckInCardReaderAction({ checkIn }: { checkIn: CheckInListItem }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [readerCheckIn, setReaderCheckIn] = useState<CheckInWithCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function openReader() {
    setIsLoading(true);

    try {
      const fullCheckIn = await requestJson<CheckInWithCategory>(`/api/checkins/${checkIn.id}`);
      queryClient.setQueryData(queryKeys.checkIn(checkIn.id), fullCheckIn);
      setReaderCheckIn(fullCheckIn);
    } catch (error) {
      toast(error instanceof Error ? error.message : "打开沉浸阅读失败", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveContent(content: string) {
    if (!readerCheckIn) {
      return;
    }

    const updatedCheckIn = await requestJson<CheckInWithCategory>(`/api/checkins/${readerCheckIn.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: readerCheckIn.title,
        categoryId: readerCheckIn.categoryId,
        studyDate: formatDate(readerCheckIn.studyDate),
        duration: readerCheckIn.duration,
        mood: readerCheckIn.mood ?? "",
        content,
      }),
    });

    setReaderCheckIn(updatedCheckIn);
    queryClient.setQueryData(queryKeys.checkIn(updatedCheckIn.id), updatedCheckIn);
    invalidateCheckInData(queryClient, updatedCheckIn.id);
    toast("阅读内容已保存");
  }

  return (
    <>
      <Button type="button" variant="secondary" className="h-10 px-3" onClick={openReader} disabled={isLoading}>
        <BookOpen className="h-4 w-4" aria-hidden="true" />
        {isLoading ? "打开中" : "沉浸编辑"}
      </Button>

      {readerCheckIn ? (
        <ImmersiveReader
          title={readerCheckIn.title}
          content={readerCheckIn.content}
          categoryName={readerCheckIn.category.name}
          categoryColor={readerCheckIn.category.color}
          editable
          showTrigger={false}
          openOnMount
          onRequestClose={() => setReaderCheckIn(null)}
          onSaveContent={saveContent}
        />
      ) : null}
    </>
  );
}

export function CheckInCard({ checkIn }: { checkIn: CheckInListItem }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function deleteCheckIn() {
    startTransition(async () => {
      const response = await fetch(`/api/checkins/${checkIn.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast(payload.message ?? "删除失败，请稍后重试", "error");
        return;
      }

      setConfirmOpen(false);
      toast(payload.message ?? "删除成功");
      invalidateCheckInData(queryClient, checkIn.id);
    });
  }

  return (
    <>
      <Card className="min-w-0 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.1)]">
        <Link
          href={`/records/${checkIn.id}`}
          className="block min-w-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20"
        >
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-950 [overflow-wrap:anywhere] [word-break:break-word]">
                {checkIn.title}
              </h2>
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
                <span
                  className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: checkIn.category.color, color: "#ffffff" }}
                >
                  <CategoryIcon name={checkIn.category.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{checkIn.category.name}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {formatDate(checkIn.studyDate)}
                </span>
                {checkIn.mood ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Smile className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{checkIn.mood}</span>
                  </span>
                ) : null}
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg px-3 py-2 text-sm font-bold"
              style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{checkIn.duration} 分钟</span>
            </span>
          </div>
        </Link>
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Link
            href={`/checkins/${checkIn.id}/edit`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            编辑
          </Link>
          <CheckInCardReaderAction checkIn={checkIn} />
          <Button type="button" variant="danger" className="h-10 px-3" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            删除
          </Button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        title="确认删除这条学习记录？"
        description="删除后无法恢复，请确认是否继续。"
        confirmLabel="确认删除"
        isPending={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={deleteCheckIn}
      />
    </>
  );
}
