import { redirect, notFound } from "next/navigation";
import { Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BoostingForm } from "@/components/challenge/BoostingForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function BoostingPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role === "USER") redirect("/login");

  const challenge = await db.challenge.findUnique({
    where: { id },
    select: { id: true, title: true, managerId: true, status: true },
  });

  if (!challenge || challenge.managerId !== user.id) notFound();
  if (!["RECRUITING", "IN_PROGRESS"].includes(challenge.status)) {
    redirect(`/manage/challenges/${id}`);
  }

  const activeBoosting = await db.challengeBoosting.findFirst({
    where: { challengeId: id, status: "ACTIVE" },
    select: { plan: true, endsAt: true },
  });

  return (
    <>
      <Header title="챌린지 부스팅" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF0C7] flex items-center justify-center">
            <Zap className="h-5 w-5 text-[#F79009]" />
          </div>
          <div>
            <p className="font-semibold text-[#101828]">{challenge.title}</p>
            <p className="text-sm text-[#667085]">상단 노출로 참가자를 늘려보세요</p>
          </div>
        </div>

        {activeBoosting && (
          <div className="bg-[#ECFDF3] rounded-2xl p-4">
            <p className="text-sm font-semibold text-[#027A48]">현재 부스팅 진행 중</p>
            <p className="text-sm text-[#027A48]">
              {activeBoosting.plan} 플랜 · {activeBoosting.endsAt ? new Date(activeBoosting.endsAt).toLocaleDateString("ko-KR") : ""} 까지
            </p>
          </div>
        )}

        <BoostingForm challengeId={id} />
      </main>
    </>
  );
}
