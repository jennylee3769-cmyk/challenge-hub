import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DisputeForm } from "@/components/my/DisputeForm";

interface PageProps { searchParams: Promise<{ challengeId?: string; certId?: string }> }

export default async function NewDisputePage({ searchParams }: PageProps) {
  const { challengeId, certId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 참가 중인 챌린지 목록
  const participations = await db.participation.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "SUCCESS", "FAILED"] } },
    include: { challenge: { select: { id: true, title: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <>
      <Header title="이의신청" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto space-y-5">
        <div className="bg-[#FFFAEB] border border-[#FDB022]/30 rounded-2xl p-4 text-sm text-[#B54708] space-y-1">
          <p className="font-semibold">이의신청 안내</p>
          <p>• 챌린지 종료 후 {5}일 이내에만 신청 가능합니다</p>
          <p>• 허위 신청 시 서비스 이용이 제한될 수 있습니다</p>
          <p>• 처리까지 최대 3영업일이 소요됩니다</p>
        </div>
        <DisputeForm
          participations={participations.map((p) => ({ id: p.challengeId, title: p.challenge.title }))}
          defaultChallengeId={challengeId}
          defaultCertId={certId}
        />
      </main>
    </>
  );
}
