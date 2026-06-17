"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookMarked, FolderPlus, Save } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/form";
import { dateInputValue } from "@/lib/date";
import type { CategorySummary } from "@/lib/types";

const moods = ["", "轻松", "一般", "困难", "状态不错", "有点吃力"];

export function CheckInForm({ categories }: { categories: CategorySummary[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (categories.length === 0) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <FolderPlus className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-bold text-slate-950">还没有分类</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          先创建一个学习分类，再回来记录今天的学习内容。
        </p>
        <ButtonLink href="/categories" className="mt-5">
          新建分类
        </ButtonLink>
      </Card>
    );
  }

  function handleSubmit(formData: FormData) {
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          categoryId: formData.get("categoryId"),
          studyDate: formData.get("studyDate"),
          duration: formData.get("duration"),
          mood: formData.get("mood"),
          content: formData.get("content"),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setError(payload.message ?? "创建学习记录失败");
        return;
      }

      router.push("/checkins");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-3xl">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <BookMarked className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">记录一次学习</h2>
          <p className="mt-0.5 text-sm text-slate-500">把今天的学习节奏留在这里</p>
        </div>
      </div>
      <form action={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">学习标题</Label>
            <Input id="title" name="title" placeholder="例如 C++ 多态复习" maxLength={50} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">分类</Label>
            <Select id="categoryId" name="categoryId" required defaultValue={categories[0]?.id}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studyDate">学习日期</Label>
            <Input id="studyDate" name="studyDate" type="date" defaultValue={dateInputValue()} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">学习时长（分钟）</Label>
            <Input id="duration" name="duration" type="number" min={1} step={1} placeholder="60" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">学习状态</Label>
            <Select id="mood" name="mood" defaultValue="">
              {moods.map((mood) => (
                <option key={mood || "empty"} value={mood}>
                  {mood || "不填写"}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="content">学习内容</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="写下今天学习的知识点、练习内容或复习重点"
              maxLength={1000}
              required
            />
          </div>
        </div>

        <FieldError message={error} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <ButtonLink href="/checkins" variant="secondary">
            返回列表
          </ButtonLink>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {isPending ? "保存中" : "保存打卡"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
