import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendChallengeJoinConfirm } from "@/lib/ses";

// 무료 챌린지 즉시 참가
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: challengeId } = await params;

  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true, title: true, status: true, entryFee: true,
      recruitEndsAt: true, maxParticipants: true,
      _count: { select: { participations: true } },
    },
  });

  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (challenge.status !== "RECRUITING") return NextResponse.json({ error: "not_recruiting" }, { status: 400 });
  if (challenge.entryFee > 0) return NextResponse.json({ error: "paid_challenge_use_payment" }, { status: 400 });
  if (new Date(challenge.recruitEndsAt) < new Date()) {
    return NextResponse.json({ error: "recruit_ended" }, { status: 400 });
  }
  if (challenge.maxParticipants && challenge._count.participations >= challenge.maxParticipants) {
    return NextResponse.json({ error: "max_participants_reached" }, { status: 400 });
  }

  // 중복 참가 확인
  const existing = await db.participation.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.userId } },
  });
  if (existing) return NextResponse.json({ error: "already_joined" }, { status: 409 });

  const participation = await db.participation.create({
    data: { challengeId, userId: session.userId, status: "ACTIVE" },
  });

  // 이메일 발송 (비동기, 실패해도 무시)
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { email: true, nickname: true } });
  if (user?.email) {
    sendChallengeJoinConfirm({
      to: user.email,
      nickname: user.nickname,
      challengeTitle: challenge.title,
      challengeId,
    }).catch(console.error);
  }

  return NextResponse.json({ participationId: participation.id }, { status: 201 });
}

// 챌린지 탈퇴
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: challengeId } = await params;

  const participation = await db.participation.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.userId } },
    include: { challenge: { select: { status: true, entryFee: true } } },
  });

  if (!participation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (participation.status !== "ACTIVE") return NextResponse.json({ error: "not_active" }, { status: 400 });

  const { status, entryFee } = participation.challenge;
  if (!["RECRUITING", "IN_PROGRESS"].includes(status)) {
    return NextResponse.json({ error: "cannot_withdraw" }, { status: 400 });
  }

  // 진행 중 탈퇴 시 환불 없음 (PRD §5.2.3)
  // 모집 중 탈퇴 시만 환불
  if (status === "RECRUITING" && entryFee > 0 && participation.paymentId) {
    const payment = await db.payment.findUnique({ where: { id: participation.paymentId } });
    if (payment?.pgPaymentKey) {
      const { cancelPayment } = await import("@/lib/toss");
      await cancelPayment(payment.pgPaymentKey, "참가자 자진 탈퇴");
      await db.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", refundedAt: new Date() } });
    }
  }

  await db.participation.update({
    where: { id: participation.id },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
