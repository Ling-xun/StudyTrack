"use client";

import { FolderKanban } from "lucide-react";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { useCategories } from "@/lib/queries";

function CategoriesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <Skeleton className="h-12 w-12" />
          <Skeleton className="mt-5 h-5 w-36" />
          <Skeleton className="mt-3 h-4 w-28" />
        </Card>
      ))}
    </div>
  );
}

export function CategoriesClient() {
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  return (
    <>
      <PageHeader title="分类管理" description="创建并查看学习分类，让之后的打卡记录更清楚。" />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <CategoryForm />

        {!categoriesQuery.data && categoriesQuery.isError ? (
          <QueryErrorState title="分类列表暂时不可用" />
        ) : !categoriesQuery.data && categoriesQuery.isLoading ? (
          <CategoriesSkeleton />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="还没有分类"
            description="先创建一个学习分类，例如 C++、算法、英语。"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} count={category.checkInCount} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
