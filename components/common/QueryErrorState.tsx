import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function QueryErrorState({
  title = "数据暂时不可用",
  description = "请稍后重试，或检查登录状态和数据服务连接。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-bold text-slate-950">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </Card>
  );
}
