import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";
import type { CategorySummary } from "@/lib/types";

export function CategoryCard({
  category,
  count,
}: {
  category: CategorySummary;
  count?: number;
}) {
  return (
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
        </div>
        <span
          className="h-7 w-7 rounded-full border-4 border-white shadow-sm"
          style={{ backgroundColor: category.color }}
        />
      </div>
    </Card>
  );
}
