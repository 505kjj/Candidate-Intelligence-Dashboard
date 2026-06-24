import { CandidateDetailClient } from "@/components/CandidateDetailClient";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CandidateDetailClient candidateId={id} />;
}
