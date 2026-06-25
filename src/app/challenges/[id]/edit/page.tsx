import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChallengeEditForm } from "@/components/challenge/ChallengeEditForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function ChallengeEditPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/challenges/${id}/edit`);

  const challenge = await db.challenge.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true,
      coverImageUrl: true, hashtags: true, status: true, managerId: true,
      requiredHashtags: true, certDailyDeadline: true,
    },
  });

  if (!challenge) notFound();
  if (challenge.managerId !== user.id) redirect(`/challenges/${id}`);
  if (["REVIEWING", "COMPLETED", "CANCELLED"].includes(challenge.status)) {
    redirect(`/manage/challenges/${id}`);
  }

  return (
    <>
      <Header title="챌린지 수정" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto">
        <ChallengeEditForm challenge={challenge} />
      </main>
    </>
  );
}
