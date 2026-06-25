import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChallengeCard, ChallengeCardSkeleton } from "@/components/challenge/ChallengeCard";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ChallengeSummary, ChallengeCategory, ChannelType } from "@/types";
import { CATEGORY_LABELS, CHANNEL_LABELS } from "@/types";
import Link from "next/link";
import { SortSelect } from "@/components/challenge/SortSelect";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    channel?: string;
    sort?: string;
    q?: string;
  }>;
}

async function ChallengeList({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const { category, channel, sort, q } = searchParams;

  let mapped: ChallengeSummary[] = [];
  try {
    const challenges = await db.challenge.findMany({
      where: {
        status: { in: ["RECRUITING", "IN_PROGRESS"] },
        isPublic: true,
        ...(category && { category: category as ChallengeCategory }),
        ...(channel && { channelType: channel as ChannelType }),
        ...(q && { title: { contains: q, mode: "insensitive" } }),
      },
      orderBy:
        sort === "popular"
          ? [{ boostings: { _count: "desc" } }, { participations: { _count: "desc" } }]
          : sort === "prize"
          ? [{ entryFee: "desc" }]
          : [{ createdAt: "desc" }],
      take: 20,
      include: {
        manager: { select: { id: true, nickname: true, profileImageUrl: true } },
        _count: { select: { participations: true } },
        boostings: { where: { status: "ACTIVE" }, take: 1 },
      },
    });

    mapped = challenges.map((c) => ({
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      recruitEndsAt: c.recruitEndsAt.toISOString(),
      rewardModel: c.rewardModel as any,
      certFrequency: c.certFrequency as any,
      channelType: c.channelType as any,
      category: c.category as any,
      status: c.status as any,
      isBoosted: c.boostings.length > 0,
    }));
  } catch {
    // DB 미연결 시 빈 목록 반환
  }

  if (mapped.length === 0) {
    return (
      <div className="text-center py-20 text-[#98A2B3]">
        <p className="font-medium">검색 결과가 없어요</p>
        <p className="text-sm mt-1">다른 조건으로 검색해보세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 pb-24">
      {mapped.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
    </div>
  );
}

export default async function ChallengesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ChallengeCategory, string][];
  const CHANNELS = Object.entries(CHANNEL_LABELS) as [ChannelType, string][];
  return (
    <>
      <Header title="챌린지 탐색" variant="plain" />

      <main>
        {/* 채널 필터 */}
        <div className="px-4 pt-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-3">
            <Link href="/challenges">
              <Badge
                variant={!params.channel ? "recruiting" : "category"}
                className="cursor-pointer px-3 py-1.5"
              >
                전체
              </Badge>
            </Link>
            {CHANNELS.map(([key, label]) => (
              <Link key={key} href={`/challenges?channel=${key}`}>
                <Badge
                  variant={params.channel === key ? "recruiting" : "category"}
                  className="cursor-pointer px-3 py-1.5"
                >
                  {label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* 카테고리 + 정렬 */}
        <div className="px-4 pb-4 flex items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORIES.slice(0, 4).map(([key, label]) => (
              <Link key={key} href={`/challenges?${params.channel ? `channel=${params.channel}&` : ""}category=${key}`}>
                <Badge
                  variant={params.category === key ? "recruiting" : "category"}
                  className="cursor-pointer shrink-0"
                >
                  {label}
                </Badge>
              </Link>
            ))}
          </div>
          <SortSelect current={params.sort} />
        </div>

        <Suspense
          fallback={
            <div className="grid gap-4 px-4 pb-24">
              {[1, 2, 3, 4].map((i) => <ChallengeCardSkeleton key={i} />)}
            </div>
          }
        >
          <ChallengeList searchParams={params} />
        </Suspense>
      </main>

      <BottomNav role={user?.role} />
    </>
  );
}
