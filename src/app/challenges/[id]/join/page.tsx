import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { JoinPaymentForm } from "@/components/challenge/JoinPaymentForm";
import { formatMoney, simulatePrize } from "@/lib/utils";

interface PageProps { params: Promise<{ id: string }> }

export default async function JoinPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/challenges/${id}/join`);

  const challenge = await db.challenge.findUnique({
    where: { id },
    select: {
      id: true, title: true, status: true, entryFee: true,
      managerFeePct: true, recruitEndsAt: true,
      _count: { select: { participations: true } },
    },
  });

  if (!challenge || challenge.status !== "RECRUITING") notFound();

  const existing = await db.participation.findUnique({
    where: { challengeId_userId: { challengeId: id, userId: user.id } },
  });
  if (existing) redirect(`/challenges/${id}`);

  const participantCount = challenge._count.participations;
  const prizeCalc = simulatePrize({
    entryFee: challenge.entryFee,
    participantCount: participantCount + 1,
    managerFeePct: challenge.managerFeePct,
    platformFeePct: 0.07,
  });

  return (
    <>
      <Header title="챌린지 참가" variant="back" />
      <main className="px-4 pt-6 pb-10 space-y-5 max-w-lg mx-auto">
        {/* 결제 요약 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 space-y-3">
          <h2 className="font-bold text-[#101828]">{challenge.title}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#667085]">참가비</span>
              <span className="font-semibold text-[#101828]">{formatMoney(challenge.entryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">예상 상금 풀 ({participantCount + 1}명 기준)</span>
              <span className="font-semibold text-[#F79009]">{formatMoney(prizeCalc.prizePool)}</span>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="text-sm text-[#667085] space-y-1">
          <p>• 챌린지 성공 시 상금이 자동으로 입금됩니다</p>
          <p>• 모집 기간 내 탈퇴 시 전액 환불됩니다</p>
          <p>• 챌린지 시작 후 탈퇴 시 환불되지 않습니다</p>
        </div>

        {/* 결제 폼 */}
        <JoinPaymentForm
          challengeId={id}
          entryFee={challenge.entryFee}
          challengeTitle={challenge.title}
          userNickname={user.nickname}
          hasPayoutAccount={!!user.payoutSellerId}
        />
      </main>
    </>
  );
}
