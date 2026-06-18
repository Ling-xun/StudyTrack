"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/ToastProvider";
import { Button, ButtonLink } from "@/components/ui/button";
import { invalidateCheckInData } from "@/lib/queries";

export function CheckInDetailActions({ checkInId }: { checkInId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function deleteCheckIn() {
    startTransition(async () => {
      const response = await fetch(`/api/checkins/${checkInId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast(payload.message ?? "删除失败，请稍后重试", "error");
        return;
      }

      setConfirmOpen(false);
      toast(payload.message ?? "删除成功");
      invalidateCheckInData(queryClient, checkInId);
      router.push("/checkins");
    });
  }

  return (
    <>
      <div
        className="sticky bottom-20 -mx-4 mt-8 flex flex-col gap-3 border-t border-white/80 bg-white/95 px-4 py-3 shadow-[0_-16px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:static sm:mx-0 sm:flex-row sm:justify-end sm:rounded-lg sm:border sm:shadow-sm"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <ButtonLink href={`/checkins/${checkInId}/edit`} variant="secondary" className="h-11">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          编辑
        </ButtonLink>
        <Button type="button" variant="danger" className="h-11" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          删除
        </Button>
      </div>
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
