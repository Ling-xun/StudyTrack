"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { CategoryIcon } from "@/lib/icons";
import { iconOptions } from "@/lib/icons";
import { invalidateCategoryData } from "@/lib/queries";
import type { CategorySummary } from "@/lib/types";

const colorOptions = ["#3B82F6", "#8B5CF6", "#F97316", "#22C55E", "#EC4899", "#14B8A6", "#64748B"];

export function CategoryCard({
  category,
  count,
}: {
  category: CategorySummary;
  count?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon);

  function updateCategory(formData: FormData) {
    startTransition(async () => {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          color,
          icon,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast(payload.message ?? "更新分类失败", "error");
        return;
      }

      setEditOpen(false);
      toast("更新成功");
      invalidateCategoryData(queryClient);
    });
  }

  function deleteCategory() {
    startTransition(async () => {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast(payload.message ?? "删除分类失败", "error");
        setDeleteOpen(false);
        return;
      }

      setDeleteOpen(false);
      toast(payload.message ?? "删除成功");
      invalidateCategoryData(queryClient);
    });
  }

  return (
    <>
      <Card className="relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.1)]">
        <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: category.color }} />
        <div className="flex items-center gap-4 pl-1">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm"
            style={{ backgroundColor: category.color, color: "#ffffff" }}
          >
            <CategoryIcon name={category.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-950">{category.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{count ?? 0} 条学习记录</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{category.color}</p>
          </div>
          <span
            className="h-7 w-7 rounded-full border-4 border-white shadow-sm"
            style={{ backgroundColor: category.color }}
          />
        </div>
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            编辑
          </Button>
          <Button type="button" variant="danger" className="h-10 px-3" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            删除
          </Button>
        </div>
      </Card>

      {editOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-white/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
            <h2 className="text-lg font-bold text-slate-950">编辑分类</h2>
            <form action={updateCategory} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`name-${category.id}`}>分类名称</Label>
                <Input id={`name-${category.id}`} name="name" defaultValue={category.name} maxLength={20} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`icon-${category.id}`}>分类图标</Label>
                <Select id={`icon-${category.id}`} value={icon} onChange={(event) => setIcon(event.target.value)}>
                  {iconOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>分类颜色</Label>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      aria-label={option}
                      onClick={() => setColor(option)}
                      className="h-9 w-9 rounded-full border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: option,
                        outline: color === option ? "2px solid #0F172A" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} disabled={isPending}>
                  取消
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "保存中..." : "保存修改"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="确认删除这个分类？"
        description={
          (count ?? 0) > 0
            ? "该分类下还有学习记录，暂时不能删除。请先删除相关学习记录，或将它们移动到其他分类。"
            : "删除后无法恢复，请确认是否继续。"
        }
        confirmLabel="确认删除"
        isPending={isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteCategory}
      />
    </>
  );
}
