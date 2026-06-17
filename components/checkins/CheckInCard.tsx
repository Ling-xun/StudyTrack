import { CalendarDays, Clock, Smile } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/lib/icons";
import { formatDate } from "@/lib/date";
import type { CheckInWithCategory } from "@/lib/types";

function excerpt(content: string) {
  return content.length > 96 ? `${content.slice(0, 96)}...` : content;
}

export function CheckInCard({ checkIn }: { checkIn: CheckInWithCategory }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">{checkIn.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: checkIn.category.color, color: "#ffffff" }}
            >
              <CategoryIcon name={checkIn.category.icon} className="h-3.5 w-3.5" />
              {checkIn.category.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatDate(checkIn.studyDate)}
            </span>
            {checkIn.mood ? (
              <span className="inline-flex items-center gap-1">
                <Smile className="h-4 w-4" aria-hidden="true" />
                {checkIn.mood}
              </span>
            ) : null}
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold"
          style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {checkIn.duration} 分钟
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{excerpt(checkIn.content)}</p>
    </Card>
  );
}
