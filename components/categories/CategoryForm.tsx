"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Palette, Plus, Shapes } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/form";
import { CategoryIcon, iconOptions } from "@/lib/icons";
import { invalidateCategoryData } from "@/lib/queries";

const colorOptions = ["#3B82F6", "#8B5CF6", "#F97316", "#22C55E", "#EC4899", "#14B8A6", "#64748B"];

export function CategoryForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(colorOptions[0]);
  const [icon, setIcon] = useState("BookOpen");

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          color,
          icon,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setError(payload.message ?? "创建分类失败");
        toast(payload.message ?? "创建分类失败", "error");
        return;
      }

      setSuccess("分类已创建");
      toast("创建成功");
      const form = document.getElementById("category-form") as HTMLFormElement | null;
      form?.reset();
      setColor(colorOptions[0]);
      setIcon("BookOpen");
      invalidateCategoryData(queryClient);
    });
  }

  return (
    <Card className="lg:sticky lg:top-8">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
        >
          <Shapes className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">新建分类</h2>
          <p className="mt-0.5 text-sm text-slate-500">给学习内容一个清晰归属</p>
        </div>
      </div>
      <form id="category-form" action={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">分类名称</Label>
          <Input id="name" name="name" placeholder="例如 C++、算法、英语" maxLength={20} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">分类图标</Label>
          <Select id="icon" value={icon} onChange={(event) => setIcon(event.target.value)}>
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
                className="h-9 w-9 rounded-full border-2 border-white shadow-sm ring-offset-2 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-900"
                style={{
                  backgroundColor: option,
                  outline: color === option ? "2px solid #0F172A" : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: color, color: "#ffffff" }}
          >
            <CategoryIcon name={icon} className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-700">预览</span>
          <Palette className="ml-auto h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>

        <FieldError message={error} />
        {success ? <p className="text-sm text-green-600">{success}</p> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isPending ? "保存中" : "保存分类"}
        </Button>
      </form>
    </Card>
  );
}
