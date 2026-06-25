import Link from "next/link";
import Image from "next/image";
import { Users, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatMoney,
  formatDday,
  simulatePrize,
} from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CHANNEL_LABELS,
  STATUS_LABELS,
  type ChallengeSummary,
} from "@/types";

interface ChallengeCardProps {
  challenge: ChallengeSummary;
}

const STATUS_BADGE_MAP: Record<string, string> = {
  RECRUITING: "recruiting",
  IN_PROGRESS: "in_progress",
  REVIEWING: "reviewing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DRAFT: "draft",
};

const CERT_FREQ_LABELS: Record<string, string> = {
  DAILY: "매일",
  WEEKLY_N: "주 N회",
  TOTAL_N: "총 N회",
};

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const participantCount = challenge._count.participations;
  const dday = formatDday(new Date(challenge.recruitEndsAt));

  const prizeEstimate = simulatePrize({
    entryFee: challenge.entryFee,
    participantCount,
    managerFeePct: challenge.managerFeePct,
    platformFeePct: 0.07,
  });

  const isClosingSoon =
    challenge.status === "RECRUITING" &&
    new Date(challenge.recruitEndsAt).getTime() - Date.now() < 3 * 86400000;

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <article className="bg-white rounded-2xl shadow-sm border border-[#EAECF0] overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
        {/* 커버 이미지 */}
        <div className="relative w-full aspect-[16/9] bg-[#F2F4F7]">
          {challenge.coverImageUrl ? (
            <Image
              src={challenge.coverImageUrl}
              alt={challenge.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E0EAFF] to-[#C7D7FE]">
              <Trophy className="h-12 w-12 text-[#6172F3] opacity-50" />
            </div>
          )}

          {/* 부스트 배지 */}
          {challenge.isBoosted && (
            <div className="absolute top-2 left-2">
              <Badge variant="featured">
                <Zap className="h-3 w-3" />
                추천
              </Badge>
            </div>
          )}

          {/* 상태 배지 */}
          <div className="absolute top-2 right-2">
            <Badge variant={STATUS_BADGE_MAP[challenge.status] as any}>
              {STATUS_LABELS[challenge.status]}
            </Badge>
          </div>

          {/* 마감 임박 */}
          {isClosingSoon && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="closing">{dday} 마감</Badge>
            </div>
          )}
        </div>

        {/* 카드 본문 */}
        <div className="p-4 space-y-3">
          {/* 채널 + 카테고리 */}
          <div className="flex items-center gap-1.5">
            <Badge variant="category">
              {CHANNEL_LABELS[challenge.channelType]}
            </Badge>
            <Badge variant="category">
              {CATEGORY_LABELS[challenge.category]}
            </Badge>
          </div>

          {/* 제목 */}
          <h3 className="font-semibold text-[#101828] line-clamp-2 leading-snug">
            {challenge.title}
          </h3>

          {/* 참가자 + 인증 주기 */}
          <div className="flex items-center gap-3 text-sm text-[#667085]">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {participantCount.toLocaleString()}명 참여
            </span>
            <span>·</span>
            <span>{CERT_FREQ_LABELS[challenge.certFrequency]} 인증</span>
            <span>·</span>
            <span>성공률 {challenge.certSuccessPct}%</span>
          </div>

          {/* 상금 구분선 */}
          <div className="border-t border-[#F2F4F7] pt-3">
            {challenge.entryFee === 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#667085]">참가비</span>
                <Badge variant="free">무료</Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#98A2B3]">참가비</p>
                  <p className="font-semibold text-[#344054]">
                    {formatMoney(challenge.entryFee)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#98A2B3]">예상 상금</p>
                  <p className="font-bold text-[#F79009]">
                    {formatMoney(prizeEstimate.prizePool)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#EAECF0] overflow-hidden animate-pulse">
      <div className="w-full aspect-[16/9] bg-[#F2F4F7]" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-12 rounded-full bg-[#F2F4F7]" />
          <div className="h-5 w-12 rounded-full bg-[#F2F4F7]" />
        </div>
        <div className="h-5 w-3/4 rounded bg-[#F2F4F7]" />
        <div className="h-4 w-full rounded bg-[#F2F4F7]" />
        <div className="border-t border-[#F2F4F7] pt-3 flex justify-between">
          <div className="h-5 w-20 rounded bg-[#F2F4F7]" />
          <div className="h-5 w-24 rounded bg-[#F2F4F7]" />
        </div>
      </div>
    </div>
  );
}
