import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calcWithholding } from "@/lib/utils";
import { requestPayout } from "@/lib/toss";
import { sendSettlementComplete } from "@/lib/ses";

// 챌린지 종료 후 상금 정산 처리 (ADMIN 전용 or 자동 배치)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id: challengeId } = await params;

  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true, title: true, status: true,
      entryFee: true, managerFeePct: true, rewardModel: true,
      certSuccessPct: true,
    },
  });

  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!["REVIEWING", "IN_PROGRESS"].includes(challenge.status)) {
    return NextResponse.json({ error: "not_settleable" }, { status: 400 });
  }

  // 성공자 집계
  const successParticipations = await db.participation.findMany({
    where: { challengeId, status: "SUCCESS" },
    include: {
      user: { select: { id: true, nickname: true, email: true, payoutSellerId: true } },
    },
  });

  if (successParticipations.length === 0) {
    // 성공자 없으면 전액 환불 처리
    await db.challenge.update({ where: { id: challengeId }, data: { status: "COMPLETED" } });
    return NextResponse.json({ settled: 0, message: "no_winners_all_refunded" });
  }

  // 상금 풀 계산
  const totalPool = challenge.entryFee * (
    await db.participation.count({ where: { challengeId, status: { not: "WITHDRAWN" } } })
  );
  const platformFee = Math.floor(totalPool * 0.07);
  const managerFee = Math.floor((totalPool - platformFee) * (challenge.managerFeePct / 100));
  const prizePool = totalPool - platformFee - managerFee;
  const perPerson = Math.floor(prizePool / successParticipations.length);

  const results: { userId: string; status: string }[] = [];

  for (const p of successParticipations) {
    // 이미 정산된 경우 스킵
    const existing = await db.settlement.findUnique({ where: { participationId: p.id } });
    if (existing) continue;

    const { tax, net } = calcWithholding(perPerson);

    let payoutStatus = "PENDING";
    let payoutRequestId: string | undefined;

    // 토스 지급대행 출금
    if (p.user.payoutSellerId && net > 0) {
      try {
        const payout = await requestPayout({
          sellerId: p.user.payoutSellerId,
          amount: net,
          orderId: `SETTLE-${p.id}-${Date.now()}`,
          orderName: `${challenge.title} 상금`,
        });
        payoutRequestId = payout.payoutKey;
        payoutStatus = "PAID";
      } catch {
        payoutStatus = "FAILED";
      }
    }

    await db.settlement.create({
      data: {
        challengeId,
        participationId: p.id,
        grossAmount: perPerson,
        taxAmount: tax,
        netAmount: net,
        payoutRequestId,
        status: payoutStatus as any,
        paidAt: payoutStatus === "PAID" ? new Date() : null,
      },
    });

    // 이메일 발송
    if (p.user.email && payoutStatus === "PAID") {
      sendSettlementComplete({
        to: p.user.email,
        nickname: p.user.nickname,
        challengeTitle: challenge.title,
        grossAmount: perPerson,
        taxAmount: tax,
        netAmount: net,
      }).catch(console.error);
    }

    results.push({ userId: p.userId, status: payoutStatus });
  }

  await db.challenge.update({ where: { id: challengeId }, data: { status: "COMPLETED" } });

  return NextResponse.json({
    settled: results.length,
    prizePool,
    perPerson,
    results,
  });
}
