import { formatDuration } from "@/lib/statistics";

export function SevenDayDurationChart({
  data,
}: {
  data: Array<{
    date: string;
    duration: number;
  }>;
}) {
  const maxDuration = Math.max(...data.map((item) => item.duration), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = Math.max((item.duration / maxDuration) * 100, item.duration > 0 ? 8 : 0);
        const label = item.date.slice(5);

        return (
          <div key={item.date} className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="font-semibold text-slate-500">{label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-right font-bold text-slate-700">{formatDuration(item.duration)}</span>
          </div>
        );
      })}
    </div>
  );
}
