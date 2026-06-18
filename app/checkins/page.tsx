import { Suspense } from "react";
import { CheckInsClient } from "@/components/checkins/CheckInsClient";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function CheckInsFallback() {
  return (
    <>
      <PageHeader title="学习记录" description="查看、搜索和管理你的学习打卡内容。" action={<ButtonLink href="/checkins/new">新建打卡</ButtonLink>} />
      <Card className="mb-5">
        <Skeleton className="h-24 w-full" />
      </Card>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-4 h-4 w-72 max-w-full" />
          </Card>
        ))}
      </div>
    </>
  );
}

export default function CheckInsPage() {
  return (
    <Suspense fallback={<CheckInsFallback />}>
      <CheckInsClient />
    </Suspense>
  );
}
