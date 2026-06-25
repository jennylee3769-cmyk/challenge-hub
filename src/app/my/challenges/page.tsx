import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { type ParticipationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDday } from "@/lib/utils";

type Tab = "active" | "completed" | "failed";

interface PageProps { searchParams: Promise<{ tab?: string }> }

export default async function MyChallengesPage({ searchParams }: PageProps) {
  const { tab = "active" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const statusMap: Record<string, ParticipationStatus[]> = {
    active: ["ACTIVE"],
    completed: ["SUCCESS"],
    failed: ["FAILED", "WITHDRAWN"],
  };

  const participations = await db.participation.findMany({
    where: { userId: user.id, status: { in: statusMap[tab] ?? ["ACTIVE"] } },
    orderBy: { joinedAt: "desc" },
    include: {
      challenge: {
        select: {
          id: true, title: true, status: true,
          coverImageUrl: true, startsAt: true, endsAt: true,
          channelType: true, entryFee: true,
        },
      },
    },
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: "진행 중" },
    { key: "completed", label: "완료" },
    { key: "failed", label: "실패/탈퇴" },
  ];

  return (
    <>
      <Header title="내 챌린지" variant="back" />
      <main className="max-w-lg mx-auto pb-10">
        {/* 탭 */}
        <div className="flex border-b border-[#F2F4F7] px-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/my/challenges?tab=${t.key}`}
              className={`flex-1 text-center py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-[#6172F3] text-[#6172F3]" : "border-transparent text-[#667085]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="px-4 pt-4 space-y-3">
          {participations.map((p) => (
            <Link
              key={p.id}
              href={`/challenges/${p.challenge.id}`}
              className="flex items-start gap-3 p-3 rounded-2xl hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-16 h-16 rounded-xl bg-[#F2F4F7] shrink-0 overflow-hidden">
                {p.challenge.coverImageUrl ? (
                  <img src={p.challenge.coverImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {p.challenge.channelType === "BLOG" ? "✍️" : p.challenge.channelType === "YOUTUBE" ? "📺" : "📱"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#101828] truncate">{p.challenge.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={p.challenge.status.toLowerCase() as any}>{p.challenge.status}</Badge>
                  <span className="text-xs text-[#98A2B3]">
                    {formatDday(p.challenge.endsAt)}
                  </span>
                </div>
                <p className="text-xs text-[#98A2B3] mt-0.5">
                  참가: {formatDate(p.joinedAt)} · 인증 {p.certCount}회
                </p>
              </div>
            </Link>
          ))}

          {participations.length === 0 && (
            <div className="text-center py-16 text-[#98A2B3]">
              <p className="text-4xl mb-3">🏆</p>
              <p>챌린지가 없어요</p>
              {tab === "active" && (
                <Link href="/challenges" className="text-sm text-[#6172F3] mt-2 inline-block">
                  챌린지 둘러보기 →
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
