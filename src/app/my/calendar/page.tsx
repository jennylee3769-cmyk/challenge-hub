import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarView } from "@/components/my/CalendarView";

interface PageProps { searchParams: Promise<{ challengeId?: string }> }

export default async function MyCalendarPage({ searchParams }: PageProps) {
  const { challengeId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 활성 참가 챌린지 목록
  const participations = await db.participation.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { challenge: { select: { id: true, title: true, startsAt: true, endsAt: true } } },
    orderBy: { joinedAt: "desc" },
  });

  const selectedId = challengeId ?? participations[0]?.challengeId;

  // 선택된 챌린지의 인증 기록
  let certDates: string[] = [];
  let approvedDates: string[] = [];

  if (selectedId) {
    const certs = await db.certification.findMany({
      where: { challengeId: selectedId, userId: user.id },
      select: { submittedAt: true, status: true },
    });
    certDates = certs.map((c) => c.submittedAt.toISOString().split("T")[0]);
    approvedDates = certs
      .filter((c) => c.status === "APPROVED")
      .map((c) => c.submittedAt.toISOString().split("T")[0]);
  }

  return (
    <>
      <Header title="인증 캘린더" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto">
        {/* 챌린지 선택 */}
        {participations.length > 1 && (
          <div className="mb-4 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {participations.map((p) => (
                <a
                  key={p.challengeId}
                  href={`/my/calendar?challengeId=${p.challengeId}`}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedId === p.challengeId
                      ? "bg-[#6172F3] text-white"
                      : "bg-[#F2F4F7] text-[#344054]"
                  }`}
                >
                  {p.challenge.title.length > 12 ? p.challenge.title.slice(0, 12) + "…" : p.challenge.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {selectedId ? (
          <CalendarView
            certDates={certDates}
            approvedDates={approvedDates}
            challengeId={selectedId}
          />
        ) : (
          <div className="text-center py-16 text-[#98A2B3]">
            <p className="text-4xl mb-3">📅</p>
            <p>참가 중인 챌린지가 없어요</p>
          </div>
        )}

        {/* 범례 */}
        <div className="flex items-center gap-4 mt-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#6172F3]" />
            <span className="text-xs text-[#667085]">승인</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#F79009]" />
            <span className="text-xs text-[#667085]">대기</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#F2F4F7] border border-[#D0D5DD]" />
            <span className="text-xs text-[#667085]">미인증</span>
          </div>
        </div>
      </main>
    </>
  );
}
