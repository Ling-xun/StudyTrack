"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import type { CategorySummary } from "@/lib/types";

export function CheckInFilterBar({
  categories,
  keyword,
  categoryId,
  date,
}: {
  categories: CategorySummary[];
  keyword: string;
  categoryId: string;
  date: string;
}) {
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    const params = new URLSearchParams();
    const nextKeyword = String(formData.get("keyword") ?? "").trim();
    const nextCategoryId = String(formData.get("categoryId") ?? "").trim();
    const nextDate = String(formData.get("date") ?? "").trim();

    if (nextKeyword) {
      params.set("keyword", nextKeyword);
    }

    if (nextCategoryId) {
      params.set("categoryId", nextCategoryId);
    }

    if (nextDate) {
      params.set("date", nextDate);
    }

    router.push(params.size > 0 ? `/checkins?${params.toString()}` : "/checkins");
  }

  return (
    <Card className="mb-5">
      <form action={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_14rem_12rem_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="keyword">关键词</Label>
          <Input id="keyword" name="keyword" defaultValue={keyword} placeholder="搜索标题或学习内容..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">分类</Label>
          <Select id="categoryId" name="categoryId" defaultValue={categoryId}>
            <option value="">全部分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">日期</Label>
          <Input id="date" name="date" type="date" defaultValue={date} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button type="submit">
            <Search className="h-4 w-4" aria-hidden="true" />
            筛选
          </Button>
          <ButtonLink href="/checkins" variant="secondary">
            <X className="h-4 w-4" aria-hidden="true" />
            清空
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
