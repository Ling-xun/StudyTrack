import { EditCheckInClient } from "@/components/checkins/EditCheckInClient";

export default async function EditCheckInPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  return <EditCheckInClient id={id} />;
}
