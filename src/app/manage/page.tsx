import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Plus, ChevronRight, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { STATUS_LABELS, type ChallengeStatus } from "@/types";

const STATUS_BADGE_MAP: Record<ChallengeStatus, string> = {
  DRAFT: "draft", RECRUITING: "recruiting", IN_PROGRESS: "in_progress",
  REVIEWING: "reviewing", COMPLETED: "completed", CANCELLED: "cancelled",
};

export default async function ManagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/manage");
  if (user.role === "USER") redirect("/my");

  const challenges = await db.challenge.findMany({
    where: { managerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participations: true, certifications: true } },
    },
  });

  const pendingCerts = await db.certification.count({
    where: {
      challenge: { managerId: user.id },
      status: "PENDING",
    },
  });

  const activeChallenges = challenges.filter((c) =>
    ["RECRUITING", "IN_PROGRESS"].includes(c.status)
  );

  return (
    <>
      <Header title="챌린지 관리" variant="plain" />

      <main className="pb-24">
        {/* 요약 통계 */}
        <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
          {[
            { label: "전체 챌린지", value: challenges.length },
            { label: "진행 중", value: activeChallenges.length },
            { label: "인증 대기", value: pendingCerts, highlight: pendingCerts > 0 },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`rounded-xl p-3 text-center ${highlight ? "bg-[#FEF0C7]" : "bg-[#F9FAFB]"}`}
            >
              <p className={`text-2xl font-bold ${highlight ? "text-[#B54708]" : "text-[#101828]"}`}>
                {value}
              </p>
              <p className="text-xs text-[#667085] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 인증 대기 알림 */}
        {pendingCerts > 0 && (
          <div className="mx-4 mt-2 flex items-center gap-3 bg-[#FFFAEB] border border-[#FDB022]/30 rounded-xl p-3">
            <AlertCircle className="h-5 w-5 text-[#F79009] shrink-0" />
            <p className="text-sm text-[#B54708] flex-1">
              검토 대기 중인 인증이 {pendingCerts}건 있어요
            </p>
            <Link href="/manage/certifications" className="text-sm text-[#B54708] font-medium shrink-0">
              검토하기 →
            </Link>
          </div>
        )}

        {/* 새 챌린지 만들기 */}
        <div className="px-4 pt-5 pb-2">
          <Link href="/challenges/new">
            <Button size="full" variant="primary" className="gap-2">
              <Plus className="h-5 w-5" />
              새 챌린지 만들기
            </Button>
          </Link>
        </div>

        {/* 챌린지 목록 */}
        <section className="px-4 pt-5">
          <h2 className="font-bold text-[#101828] mb-3">내 챌린지</h2>

          {challenges.length === 0 ? (
            <div className="text-center py-12 text-[#98A2B3]">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">아직 만든 챌린지가 없어요</p>
              <p className="text-sm mt-1">첫 챌린지를 만들어보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((c) => (
                <Link key={c.id} href={`/manage/challenges/${c.id}`}>
                  <div className="border border-[#EAECF0] rounded-xl p-4 hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#E0EAFF] overflow-hidden shrink-0">
                        {c.coverImageUrl ? (
                          <Image src={c.coverImageUrl} alt={c.title}
                            width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-[#6172F3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={STATUS_BADGE_MAP[c.status as ChallengeStatus] as any}>
                            {STATUS_LABELS[c.status as ChallengeStatus]}
                          </Badge>
                        </div>
                        <p className="font-medium text-[#101828] truncate">{c.title}</p>
                        <p className="text-xs text-[#98A2B3] mt-1">
                          {formatDate(c.startsAt)} ~ {formatDate(c.endsAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#98A2B3] shrink-0 mt-1" />
                    </div>

                    <div className="flex gap-4 mt-3 pt-3 border-t border-[#F2F4F7]">
                      <div className="flex items-center gap-1.5 text-sm text-[#667085]">
                        <Users className="h-4 w-4" />
                        <span>{c._count.participations}명 참여</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-[#667085]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>인증 {c._count.certifications}건</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav role={user.role} />
    </>
  );
}
