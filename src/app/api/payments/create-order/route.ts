import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

const Schema = z.object({ challengeId: z.string() });

// 결제 주문 생성 (토스 결제창 열기 전)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const { challengeId } = parsed.data;

  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, title: true, status: true, entryFee: true, recruitEndsAt: true, maxParticipants: true, _count: { select: { participations: true } } },
  });

  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (challenge.status !== "RECRUITING") return NextResponse.json({ error: "not_recruiting" }, { status: 400 });
  if (challenge.entryFee === 0) return NextResponse.json({ error: "free_challenge_use_join" }, { status: 400 });
  if (new Date(challenge.recruitEndsAt) < new Date()) return NextResponse.json({ error: "recruit_ended" }, { status: 400 });
  if (challenge.maxParticipants && challenge._count.participations >= challenge.maxParticipants) {
    return NextResponse.json({ error: "max_participants_reached" }, { status: 400 });
  }

  const existing = await db.participation.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.userId } },
  });
  if (existing) return NextResponse.json({ error: "already_joined" }, { status: 409 });

  // 멱등성: 같은 챌린지 PENDING 주문이 있으면 재사용
  const existingPending = await db.payment.findFirst({
    where: { userId: session.userId, challengeId, status: "PENDING" },
  });
  if (existingPending) {
    return NextResponse.json({ orderId: existingPending.pgOrderId, amount: existingPending.amount, orderName: challenge.title });
  }

  const orderId = `CH-${uuidv4().replace(/-/g, "").slice(0, 20)}`;
  const payment = await db.payment.create({
    data: {
      userId: session.userId,
      challengeId,
      amount: challenge.entryFee,
      pgOrderId: orderId,
      status: "PENDING",
    },
  });

  return NextResponse.json({ orderId, amount: challenge.entryFee, orderName: challenge.title }, { status: 201 });
}
