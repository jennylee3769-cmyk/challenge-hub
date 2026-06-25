import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CertifyForm } from "@/components/certification/CertifyForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertifyPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/challenges/${id}/certify`);

  const challenge = await db.challenge.findUnique({
    where: { id },
    select: {
      id: true, title: true, channelType: true,
      requiredHashtags: true, status: true, certFrequency: true,
    },
  });

  if (!challenge || challenge.status !== "IN_PROGRESS") notFound();

  const participation = await db.participation.findUnique({
    where: { challengeId_userId: { challengeId: id, userId: user.id } },
    select: { id: true, status: true },
  });

  if (!participation || participation.status !== "ACTIVE") {
    redirect(`/challenges/${id}`);
  }

  // 오늘 이미 인증했는지 확인
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingCert = await db.certification.findFirst({
    where: {
      participationId: participation.id,
      submittedAt: { gte: today },
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  return (
    <>
      <Header title="오늘 인증하기" variant="back" />
      <main className="pb-10">
        <CertifyForm
          challengeId={id}
          participationId={participation.id}
          channelType={challenge.channelType as any}
          requiredHashtags={challenge.requiredHashtags}
          alreadyCertified={!!existingCert}
        />
      </main>
    </>
  );
}
