import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const BOOSTING_PLANS = {
  S: { days: 3, price: 9900, label: "3일 노출" },
  M: { days: 7, price: 19900, label: "7일 노출" },
  L: { days: 14, price: 34900, label: "14일 노출" },
} as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challengeId = searchParams.get("challengeId");

  const boostings = await db.challengeBoosting.findMany({
    where: challengeId ? { challengeId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(boostings);
}

const Schema = z.object({
  challengeId: z.string(),
  plan: z.enum(["S", "M", "L"]),
  paymentKey: z.string(),
  orderId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (user?.role === "USER") return NextResponse.json({ error: "manager_only" }, { status: 403 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const { challengeId, plan, paymentKey, orderId } = parsed.data;

  const challenge = await db.challenge.findUnique({ where: { id: challengeId }, select: { managerId: true } });
  if (!challenge || challenge.managerId !== session.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const planInfo = BOOSTING_PLANS[plan];

  // 토스 결제 확인
  const { confirmPayment } = await import("@/lib/toss");
  try {
    await confirmPayment({ paymentKey, orderId, amount: planInfo.price });
  } catch (err: any) {
    return NextResponse.json({ error: "payment_failed", message: err.message }, { status: 400 });
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + planInfo.days * 24 * 60 * 60 * 1000);

  const boosting = await db.challengeBoosting.create({
    data: {
      challengeId,
      managerId: session.userId,
      plan,
      amount: planInfo.price,
      pgPaymentKey: paymentKey,
      startsAt,
      endsAt,
      status: "ACTIVE",
    },
  });

  return NextResponse.json(boosting, { status: 201 });
}
