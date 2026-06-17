"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarDays, Clock, Pencil, Smile, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";
import { formatDate } from "@/lib/date";
import type { CheckInWithCategory } from "@/lib/types";

function excerpt(content: string) {
  return content.length > 96 ? `${content.slice(0, 96)}...` : content;
}

export function CheckInCard({ checkIn }: { checkIn: CheckInWithCategory }) {
  const router = useRouter();
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
      router.refresh();
    });
  }

  return (
    <>
      <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">{checkIn.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: checkIn.category.color, color: "#ffffff" }}
            >
              <CategoryIcon name={checkIn.category.icon} className="h-3.5 w-3.5" />
              {checkIn.category.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatDate(checkIn.studyDate)}
            </span>
            {checkIn.mood ? (
              <span className="inline-flex items-center gap-1">
                <Smile className="h-4 w-4" aria-hidden="true" />
                {checkIn.mood}
              </span>
            ) : null}
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
      <p className="mt-4 text-sm leading-6 text-slate-600">{excerpt(checkIn.content)}</p>
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Link
            href={`/checkins/${checkIn.id}/edit`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            编辑
          </Link>
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
