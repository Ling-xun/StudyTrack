import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  teal: {
    icon: "bg-teal-50 text-teal-700 ring-teal-100",
    line: "from-teal-500 to-emerald-400",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    line: "from-amber-500 to-orange-400",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    line: "from-rose-500 to-pink-400",
  },
  indigo: {
    icon: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    line: "from-indigo-500 to-blue-400",
  },
};

export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "teal",
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  const styles = tones[tone];

  return (
    <Card className="relative min-h-36 overflow-hidden">
      <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", styles.line)} />
      <div className="flex items-start justify-between gap-4">
      <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-normal text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
      </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1", styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
