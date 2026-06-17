import { formatDuration } from "@/lib/statistics";

export function CategoryDurationList({
  data,
}: {
  data: Array<{
    categoryId: string;
    name: string;
    color: string;
    duration: number;
  }>;
}) {
  const total = data.reduce((sum, item) => sum + item.duration, 0);

  if (data.length === 0) {
    return <p className="text-sm leading-6 text-slate-500">还没有分类学习时长数据。</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percent = total === 0 ? 0 : Math.round((item.duration / total) * 100);

        return (
          <div key={item.categoryId}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-bold text-slate-800">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-semibold text-slate-500">
                {formatDuration(item.duration)} · {percent}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
