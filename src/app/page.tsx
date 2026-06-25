import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Flame, Clock, Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChallengeCard, ChallengeCardSkeleton } from "@/components/challenge/ChallengeCard";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ChallengeSummary } from "@/types";

async function getFeaturedChallenges(): Promise<ChallengeSummary[]> {
  try {
    const challenges = await db.challenge.findMany({
      where: { status: { in: ["RECRUITING", "IN_PROGRESS"] }, isPublic: true },
      orderBy: [{ boostings: { _count: "desc" } }, { createdAt: "desc" }],
      take: 5,
      include: {
        manager: { select: { id: true, nickname: true, profileImageUrl: true } },
        _count: { select: { participations: true } },
        boostings: { where: { status: "ACTIVE" }, take: 1 },
      },
    });
    return challenges.map((c) => ({
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      recruitEndsAt: c.recruitEndsAt.toISOString(),
      rewardModel: c.rewardModel as ChallengeSummary["rewardModel"],
      certFrequency: c.certFrequency as ChallengeSummary["certFrequency"],
      channelType: c.channelType as ChallengeSummary["channelType"],
      category: c.category as ChallengeSummary["category"],
      status: c.status as ChallengeSummary["status"],
      isBoosted: c.boostings.length > 0,
    }));
  } catch {
    return [];
  }
}

async function getRecentChallenges(): Promise<ChallengeSummary[]> {
  try {
    const challenges = await db.challenge.findMany({
      where: { status: "RECRUITING", isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        manager: { select: { id: true, nickname: true, profileImageUrl: true } },
        _count: { select: { participations: true } },
        boostings: { where: { status: "ACTIVE" }, take: 1 },
      },
    });
    return challenges.map((c) => ({
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      recruitEndsAt: c.recruitEndsAt.toISOString(),
      rewardModel: c.rewardModel as ChallengeSummary["rewardModel"],
      certFrequency: c.certFrequency as ChallengeSummary["certFrequency"],
      channelType: c.channelType as ChallengeSummary["channelType"],
      category: c.category as ChallengeSummary["category"],
      status: c.status as ChallengeSummary["status"],
      isBoosted: c.boostings.length > 0,
    }));
  } catch {
    return [];
  }
}

const CATEGORIES = [
  { key: "EXERCISE", label: "🏃 운동" },
  { key: "STUDY", label: "📚 공부" },
  { key: "READING", label: "📖 독서" },
  { key: "FINANCE", label: "💰 재테크" },
  { key: "DIET", label: "🥗 다이어트" },
  { key: "CREATION", label: "✏️ 창작" },
  { key: "PRODUCTIVITY", label: "⚡ 생산성" },
];

async function FeaturedSection() {
  const challenges = await getFeaturedChallenges();
  if (challenges.length === 0) return null;

  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg text-[#101828] flex items-center gap-1.5">
          <Flame className="h-5 w-5 text-[#F04438]" />
          인기 챌린지
        </h2>
        <Link href="/challenges?sort=popular" className="text-sm text-[#6172F3] flex items-center">
          더보기 <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {challenges.map((c) => (
          <div key={c.id} className="min-w-[280px]">
            <ChallengeCard challenge={c} />
          </div>
        ))}
      </div>
    </section>
  );
}

async function RecentSection() {
  const challenges = await getRecentChallenges();

  if (challenges.length === 0) {
    return (
      <section className="px-4 pb-24">
        <div className="text-center py-16 text-[#98A2B3]">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">아직 진행 중인 챌린지가 없어요</p>
          <p className="text-sm mt-1">첫 챌린지를 만들어보세요!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg text-[#101828] flex items-center gap-1.5">
          <Clock className="h-5 w-5 text-[#6172F3]" />
          모집 중인 챌린지
        </h2>
        <Link href="/challenges" className="text-sm text-[#6172F3] flex items-center">
          전체 <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {challenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <>
      <Header variant="home" showSearch showNotification={!!user} />
      <main>
        {/* 카테고리 필터 */}
        <div className="px-4 py-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max">
            <Link href="/challenges">
              <Badge variant="recruiting" className="cursor-pointer px-3 py-1.5 text-sm">전체</Badge>
            </Link>
            {CATEGORIES.map((cat) => (
              <Link key={cat.key} href={`/challenges?category=${cat.key}`}>
                <Badge
                  variant="category"
                  className="cursor-pointer px-3 py-1.5 text-sm hover:bg-[#E0EAFF] hover:text-[#3538CD] transition-colors"
                >
                  {cat.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* 히어로 배너 (비로그인) */}
        {!user && (
          <div className="mx-4 mb-6 rounded-2xl bg-gradient-to-br from-[#6172F3] to-[#444CE7] p-5 text-white">
            <p className="text-sm font-medium opacity-80 mb-1">챌린지 참여하고</p>
            <p className="text-2xl font-bold mb-4">상금을 받아가세요 🏆</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 bg-white text-[#6172F3] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#F0F4FF] transition-colors"
            >
              시작하기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <Suspense
          fallback={
            <section className="px-4 pb-6">
              <div className="h-7 w-32 rounded bg-[#F2F4F7] mb-3 animate-pulse" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2].map((i) => (
                  <div key={i} className="min-w-[280px]"><ChallengeCardSkeleton /></div>
                ))}
              </div>
            </section>
          }
        >
          <FeaturedSection />
        </Suspense>

        <Suspense
          fallback={
            <section className="px-4 pb-24">
              <div className="h-7 w-40 rounded bg-[#F2F4F7] mb-3 animate-pulse" />
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => <ChallengeCardSkeleton key={i} />)}
              </div>
            </section>
          }
        >
          <RecentSection />
        </Suspense>
      </main>
      <BottomNav role={user?.role} />
    </>
  );
}
