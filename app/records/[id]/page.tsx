import { RecordDetailClient } from "@/components/checkins/RecordDetailClient";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  return <RecordDetailClient id={id} />;
}
