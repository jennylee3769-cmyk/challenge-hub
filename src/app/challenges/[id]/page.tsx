import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Users, Calendar, Clock, CheckCircle2, Trophy, Star,
  AlertCircle, ChevronRight, Share2
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  formatMoney, formatDate, formatDday, calcWithholding, simulatePrize
} from "@/lib/utils";
import {
  CATEGORY_LABELS, CHANNEL_LABELS, STATUS_LABELS, REWARD_MODEL_LABELS,
  type ChallengeStatus
} from "@/types";
import { JoinButton } from "@/components/challenge/JoinButton";

const STATUS_BADGE_MAP: Record<ChallengeStatus, string> = {
  DRAFT: "draft", RECRUITING: "recruiting", IN_PROGRESS: "in_progress",
  REVIEWING: "reviewing", COMPLETED: "completed", CANCELLED: "cancelled",
};

const CERT_FREQ_LABELS: Record<string, string> = {
  DAILY: "매일", WEEKLY_N: "주 N회", TOTAL_N: "총 N회",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const challenge = await db.challenge.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, nickname: true, profileImageUrl: true } },
      _count: { select: { participations: true } },
      boostings: { where: { status: "ACTIVE" }, take: 1 },
      ...(user && {
        participations: { where: { userId: user.id }, take: 1 },
      }),
    },
  });

  if (!challenge || (!challenge.isPublic && challenge.managerId !== user?.id)) {
    notFound();
  }

  const participantCount = challenge._count.participations;
  const isParticipating = user
    ? ((challenge as any).participations?.length ?? 0) > 0
    : false;
  const isManager = user?.id === challenge.managerId;
  const dday = formatDday(new Date(challenge.recruitEndsAt));
  const isBoosted = challenge.boostings.length > 0;
  const status = challenge.status as ChallengeStatus;

  const prizeCalc = simulatePrize({
    entryFee: challenge.entryFee,
    participantCount,
    managerFeePct: challenge.managerFeePct,
    platformFeePct: 0.07,
  });

  const withholding = challenge.entryFee > 0
    ? calcWithholding(prizeCalc.prizePool)
    : null;

  return (
    <>
      <Header variant="transparent" />

      <main className="pb-32">
        {/* 커버 이미지 */}
        <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-[#E0EAFF] to-[#C7D7FE]">
          {challenge.coverImageUrl ? (
            <Image src={challenge.coverImageUrl} alt={challenge.title} fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="h-16 w-16 text-[#6172F3] opacity-40" />
            </div>
          )}
          {isBoosted && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="featured">⚡ 추천 챌린지</Badge>
            </div>
          )}
        </div>

        <div className="px-4 py-5 space-y-6">
          {/* 제목 + 상태 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={STATUS_BADGE_MAP[status] as any}>{STATUS_LABELS[status]}</Badge>
              <Badge variant="category">{(CHANNEL_LABELS as Record<string, string>)[challenge.channelType]}</Badge>
              <Badge variant="category">{(CATEGORY_LABELS as Record<string, string>)[challenge.category]}</Badge>
              <button className="ml-auto text-[#98A2B3]">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <h1 className="text-2xl font-bold text-[#101828] leading-tight">{challenge.title}</h1>
          </div>

          {/* 매니저 + 참가자 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E0EAFF] overflow-hidden shrink-0">
              {challenge.manager.profileImageUrl ? (
                <Image src={challenge.manager.profileImageUrl} alt={challenge.manager.nickname}
                  width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#6172F3] font-bold">
                  {challenge.manager.nickname[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-[#98A2B3]">매니저</p>
              <p className="text-sm font-medium text-[#344054]">{challenge.manager.nickname}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-[#98A2B3]">참여중</p>
              <p className="text-sm font-bold text-[#101828]">{participantCount.toLocaleString()}명</p>
            </div>
          </div>

          {/* 날짜/인증 요약 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: "시작일", value: formatDate(challenge.startsAt) },
              { icon: Clock, label: "종료일", value: formatDate(challenge.endsAt) },
              { icon: CheckCircle2, label: "인증", value: CERT_FREQ_LABELS[challenge.certFrequency] },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#F9FAFB] rounded-xl p-3 text-center">
                <Icon className="h-5 w-5 text-[#6172F3] mx-auto mb-1" />
                <p className="text-xs text-[#98A2B3]">{label}</p>
                <p className="text-sm font-semibold text-[#344054]">{value}</p>
              </div>
            ))}
          </div>

          {/* 상금 계산기 */}
          {challenge.entryFee > 0 && (
            <div className="bg-gradient-to-br from-[#FFFAEB] to-[#FEF0C7] rounded-2xl p-4 border border-[#FDB022]/20">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-[#F79009]" />
                <h3 className="font-bold text-[#344054]">상금 계산기</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#667085]">참가비 총액 ({participantCount}명)</span>
                  <span className="font-medium text-[#344054]">{formatMoney(prizeCalc.totalPool)}</span>
                </div>
                <div className="flex justify-between text-[#98A2B3]">
                  <span>플랫폼 수수료 (7%)</span>
                  <span>- {formatMoney(prizeCalc.platformFee)}</span>
                </div>
                {challenge.managerFeePct > 0 && (
                  <div className="flex justify-between text-[#98A2B3]">
                    <span>매니저 수수료 ({challenge.managerFeePct}%)</span>
                    <span>- {formatMoney(prizeCalc.managerFee)}</span>
                  </div>
                )}
                <div className="border-t border-[#FDB022]/30 pt-2 flex justify-between">
                  <span className="font-semibold text-[#344054]">상금 풀</span>
                  <span className="font-bold text-[#F79009] text-base">{formatMoney(prizeCalc.prizePool)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">{(REWARD_MODEL_LABELS as Record<string, string>)[challenge.rewardModel]} 1인당</span>
                  <span className="font-bold text-[#DC6803]">≈ {formatMoney(prizeCalc.perPerson)}</span>
                </div>
              </div>
              {withholding && withholding.tax > 0 && (
                <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-[#B54708] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#B54708]">
                    5만원 초과 수령 시 기타소득세 22% 원천징수. 세후 ≈ {formatMoney(withholding.net)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 소개 */}
          <div>
            <h3 className="font-bold text-[#101828] mb-3">챌린지 소개</h3>
            <p className="text-[#475467] leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
          </div>

          {/* 해시태그 */}
          {challenge.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {challenge.hashtags.map((tag) => (
                <span key={tag} className="text-sm text-[#6172F3] bg-[#F0F4FF] px-3 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* 인증 규칙 */}
          <div className="bg-[#F9FAFB] rounded-2xl p-4 space-y-2.5">
            <h3 className="font-bold text-[#101828] mb-3">인증 규칙</h3>
            {[
              { label: "인증 주기", value: CERT_FREQ_LABELS[challenge.certFrequency] },
              { label: "성공 기준", value: `목표 달성률 ${challenge.certSuccessPct}% 이상` },
              { label: "이의신청 기간", value: `챌린지 종료 후 ${challenge.disputePeriodDays}일` },
              ...(challenge.requiredHashtags.length > 0
                ? [{ label: "필수 해시태그", value: challenge.requiredHashtags.map(t => `#${t}`).join(" ") }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-[#667085]">{label}</span>
                <span className="font-medium text-[#344054]">{value}</span>
              </div>
            ))}
          </div>

          {/* 매니저 관리 버튼 */}
          {isManager && (
            <Link href={`/manage/challenges/${challenge.id}`}
              className="flex items-center justify-between p-4 border border-[#D0D5DD] rounded-xl hover:bg-[#F9FAFB]">
              <span className="font-medium text-[#344054]">매니저 대시보드로 이동</span>
              <ChevronRight className="h-5 w-5 text-[#98A2B3]" />
            </Link>
          )}
        </div>
      </main>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EAECF0] pb-safe">
        <div className="max-w-lg mx-auto px-4 py-3">
          {status === "RECRUITING" && !isManager && (
            <JoinButton
              challengeId={challenge.id}
              entryFee={challenge.entryFee}
              isParticipating={isParticipating}
              isLoggedIn={!!user}
              recruitEndsAt={challenge.recruitEndsAt.toISOString()}
              dday={dday}
            />
          )}
          {status === "IN_PROGRESS" && isParticipating && (
            <Link href={`/challenges/${challenge.id}/certify`}>
              <Button size="full">오늘 인증하기</Button>
            </Link>
          )}
          {status === "IN_PROGRESS" && !isParticipating && !isManager && (
            <Button size="full" variant="secondary" disabled>진행 중 (참가 마감)</Button>
          )}
          {(status === "REVIEWING" || status === "COMPLETED") && (
            <Link href={`/challenges/${challenge.id}/ranking`}>
              <Button size="full" variant="secondary">결과 보기</Button>
            </Link>
          )}
        </div>
      </div>

      <BottomNav role={user?.role} />
    </>
  );
}
