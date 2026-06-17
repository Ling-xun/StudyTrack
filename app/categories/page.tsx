import { FolderKanban } from "lucide-react";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import type { CategorySummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { checkIns: true },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="分类管理"
        description="创建并查看学习分类，让之后的打卡记录更清楚。"
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <CategoryForm />

        {categories.length === 0 ? (
          <Card className="flex min-h-72 flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <FolderKanban className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold text-slate-950">还没有分类</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              先创建一个学习分类，例如 C++、算法、英语。
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category as CategorySummary}
                count={category._count.checkIns}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
