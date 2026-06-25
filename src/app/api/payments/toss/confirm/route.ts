import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { confirmPayment } from "@/lib/toss";
import { sendChallengeJoinConfirm } from "@/lib/ses";

const ConfirmSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number(),
  challengeId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const { paymentKey, orderId, amount, challengeId } = parsed.data;

  // orderId 검증 — DB에 미리 생성된 Payment 확인
  const payment = await db.payment.findUnique({ where: { pgOrderId: orderId } });
  if (!payment) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  if (payment.userId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (payment.amount !== amount) return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
  if (payment.status !== "PENDING") return NextResponse.json({ error: "already_processed" }, { status: 409 });

  // 토스 결제 승인
  let tossData: any;
  try {
    tossData = await confirmPayment({ paymentKey, orderId, amount });
  } catch (err: any) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "payment_failed", message: err.message }, { status: 400 });
  }

  // 트랜잭션: 결제 완료 + 참가 생성
  const [updatedPayment, participation] = await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", pgPaymentKey: paymentKey, completedAt: new Date() },
    }),
    db.participation.create({
      data: {
        challengeId,
        userId: session.userId,
        status: "ACTIVE",
        paymentId: payment.id,
      },
    }),
  ]);

  // 이메일 발송 (비동기)
  const [user, challenge] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { email: true, nickname: true } }),
    db.challenge.findUnique({ where: { id: challengeId }, select: { title: true } }),
  ]);
  if (user?.email && challenge) {
    sendChallengeJoinConfirm({
      to: user.email,
      nickname: user.nickname,
      challengeTitle: challenge.title,
      challengeId,
    }).catch(console.error);
  }

  return NextResponse.json({ participationId: participation.id, status: "COMPLETED" });
}
