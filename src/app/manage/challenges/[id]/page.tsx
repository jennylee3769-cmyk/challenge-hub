import React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate, calcWithholding } from "@/lib/utils";

interface PageProps { params: Promise<{ id: string }> }

export default async function ManageChallengeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role === "USER") redirect("/login");

  const challenge = await db.challenge.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          participations: true,
          certifications: true,
        },
      },
    },
  });

  if (!challenge || challenge.managerId !== user.id) notFound();

  const [pendingCerts, recentCerts, totalPool] = await Promise.all([
    db.certification.count({ where: { challengeId: id, status: "PENDING" } }),
    db.certification.findMany({
      where: { challengeId: id },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { user: { select: { nickname: true } } },
    }),
    db.payment.aggregate({ where: { challengeId: id, status: "COMPLETED" }, _sum: { amount: true } }),
  ]);

  const pool = totalPool._sum.amount ?? 0;
  const platformFee = Math.floor(pool * 0.07);
  const managerFee = Math.floor((pool - platformFee) * (challenge.managerFeePct / 100));
  const prizePool = pool - platformFee - managerFee;

  const certStatusIcon: Record<string, React.ReactElement> = {
    PENDING: <Clock className="h-4 w-4 text-[#F79009]" />,
    APPROVED: <CheckCircle className="h-4 w-4 text-[#12B76A]" />,
    REJECTED: <XCircle className="h-4 w-4 text-[#F04438]" />,
  };

  return (
    <>
      <Header title={challenge.title} variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto space-y-4">
        {/* 상태 배지 */}
        <div className="flex items-center gap-2">
          <Badge variant={challenge.status.toLowerCase() as any}>{challenge.status}</Badge>
          {pendingCerts > 0 && (
            <span className="text-xs bg-[#FEE4E2] text-[#B42318] px-2 py-0.5 rounded-full font-medium">
              인증 대기 {pendingCerts}건
            </span>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F9FAFB] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[#667085]" />
              <span className="text-xs text-[#667085]">참가자</span>
            </div>
            <p className="text-2xl font-bold text-[#101828]">{challenge._count.participations}</p>
            {challenge.maxParticipants && (
              <p className="text-xs text-[#98A2B3]">/ {challenge.maxParticipants}명</p>
            )}
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-[#667085]" />
              <span className="text-xs text-[#667085]">총 인증</span>
            </div>
            <p className="text-2xl font-bold text-[#101828]">{challenge._count.certifications}</p>
          </div>
        </div>

        {/* 상금 풀 */}
        {pool > 0 && (
          <div className="bg-[#F0F4FF] rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[#3538CD]">상금 풀 현황</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#667085]">총 참가비</span>
                <span>{formatMoney(pool)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">플랫폼 수수료 (7%)</span>
                <span>-{formatMoney(platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">매니저 수익 ({challenge.managerFeePct}%)</span>
                <span className="text-[#6172F3] font-semibold">{formatMoney(managerFee)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-[#C7D2FE] pt-1.5 mt-1.5">
                <span>참가자 상금 풀</span>
                <span className="text-[#F79009]">{formatMoney(prizePool)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 인증 대기 알림 */}
        {pendingCerts > 0 && (
          <Link href="/manage/certifications" className="flex items-center gap-3 bg-[#FFFAEB] border border-[#FDB022]/30 rounded-2xl p-4">
            <AlertTriangle className="h-5 w-5 text-[#F79009] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#B54708]">인증 {pendingCerts}건 검토 대기</p>
              <p className="text-xs text-[#B54708]">빠르게 검토해주세요</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#F79009]" />
          </Link>
        )}

        {/* 최근 인증 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#101828]">최근 인증</h3>
            <Link href="/manage/certifications" className="text-sm text-[#6172F3]">전체 보기</Link>
          </div>
          <div className="space-y-2">
            {recentCerts.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3 py-2 border-b border-[#F2F4F7]">
                {certStatusIcon[cert.status as keyof typeof certStatusIcon]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#344054] truncate">{cert.user.nickname}</p>
                  <p className="text-xs text-[#98A2B3]">{formatDate(cert.submittedAt)}</p>
                </div>
              </div>
            ))}
            {recentCerts.length === 0 && (
              <p className="text-sm text-[#98A2B3] text-center py-4">아직 인증이 없어요</p>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2 pt-2">
          <Link href={`/challenges/${id}`}>
            <Button variant="secondary" size="full">챌린지 페이지 보기</Button>
          </Link>
          {challenge.status === "RECRUITING" && (
            <Link href={`/challenges/${id}/edit`}>
              <Button variant="secondary" size="full">챌린지 수정</Button>
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
