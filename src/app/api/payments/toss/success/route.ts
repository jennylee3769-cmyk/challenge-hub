import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { confirmPayment } from "@/lib/toss";
import { db } from "@/lib/db";
import { sendChallengeJoinConfirm } from "@/lib/ses";

// 토스 결제 성공 리다이렉트 처리
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = new URL(req.url);
  const paymentKey = searchParams.get("paymentKey") ?? "";
  const orderId = searchParams.get("orderId") ?? "";
  const amount = Number(searchParams.get("amount") ?? "0");
  const challengeId = searchParams.get("challengeId") ?? "";

  try {
    const payment = await db.payment.findUnique({ where: { pgOrderId: orderId } });
    if (!payment || payment.userId !== session.userId || payment.amount !== amount) {
      throw new Error("invalid_payment");
    }
    if (payment.status === "COMPLETED") {
      return NextResponse.redirect(new URL(`/challenges/${challengeId}?joined=1`, req.url));
    }

    await confirmPayment({ paymentKey, orderId, amount });

    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETED", pgPaymentKey: paymentKey, completedAt: new Date() },
      }),
      db.participation.create({
        data: { challengeId, userId: session.userId, status: "ACTIVE", paymentId: payment.id },
      }),
    ]);

    const [user, challenge] = await Promise.all([
      db.user.findUnique({ where: { id: session.userId }, select: { email: true, nickname: true } }),
      db.challenge.findUnique({ where: { id: challengeId }, select: { title: true } }),
    ]);
    if (user?.email && challenge) {
      sendChallengeJoinConfirm({ to: user.email, nickname: user.nickname, challengeTitle: challenge.title, challengeId }).catch(console.error);
    }

    return NextResponse.redirect(new URL(`/challenges/${challengeId}?joined=1`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/challenges/${challengeId}/join?error=payment_failed`, req.url));
  }
}
