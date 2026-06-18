import { Skeleton } from "@/components/common/Skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200/70 pb-5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-4 h-9 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-3 h-4 w-28" />
          </Card>
        ))}
      </div>
    </div>
  );
}
