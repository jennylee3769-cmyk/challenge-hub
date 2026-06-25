import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, nickname: true, profileImageUrl: true, email: true, role: true,
      identityVerifiedAt: true, payoutRegisteredAt: true,
      payoutBankCode: true, payoutAccount: true, payoutHolderName: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 계좌번호 마스킹
  const { maskAccount } = await import("@/lib/encrypt");
  return NextResponse.json({
    ...user,
    payoutAccount: user.payoutAccount ? maskAccount(user.payoutAccount) : null,
    createdAt: user.createdAt.toISOString(),
  });
}

const PatchSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  profileImageUrl: z.string().url().nullable().optional(),
}).strict();

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const updated = await db.user.update({
    where: { id: session.userId },
    data: parsed.data,
    select: { id: true, nickname: true, profileImageUrl: true },
  });

  return NextResponse.json(updated);
}
