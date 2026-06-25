import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const CertSchema = z.object({
  participationId: z.string(),
  submitType: z.enum(["LINK", "PHOTO", "MIXED"]),
  url: z.string().url().optional(),
  photoUrls: z.array(z.string()).default([]),
  memo: z.string().max(200).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: challengeId } = await params;
  const body = await req.json();
  const parsed = CertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 });
  }

  const { participationId, submitType, url, photoUrls } = parsed.data;

  // 참가 확인
  const participation = await db.participation.findFirst({
    where: { id: participationId, userId: session.userId, challengeId, status: "ACTIVE" },
    include: { challenge: { select: { status: true } } },
  });

  if (!participation) {
    return NextResponse.json({ error: "participation_not_found" }, { status: 404 });
  }
  if (participation.challenge.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "challenge_not_in_progress" }, { status: 400 });
  }

  // 오늘 중복 인증 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await db.certification.findFirst({
    where: {
      participationId,
      submittedAt: { gte: today },
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "already_certified_today" }, { status: 409 });
  }

  const cert = await db.certification.create({
    data: {
      participationId,
      challengeId,
      userId: session.userId,
      submitType,
      url,
      photoUrls,
      status: "PENDING",
    },
  });

  // 인증 카운트 업데이트
  await db.participation.update({
    where: { id: participationId },
    data: { certCount: { increment: 1 } },
  });

  return NextResponse.json({ id: cert.id }, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: challengeId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const cursor = searchParams.get("cursor");

  const certs = await db.certification.findMany({
    where: {
      challengeId,
      ...(status && { status: status as any }),
      ...(cursor && { id: { lt: cursor } }),
    },
    orderBy: { submittedAt: "desc" },
    take: limit + 1,
    include: {
      user: { select: { id: true, nickname: true, profileImageUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const hasMore = certs.length > limit;
  const data = hasMore ? certs.slice(0, limit) : certs;

  return NextResponse.json({
    data: data.map((c) => ({ ...c, submittedAt: c.submittedAt.toISOString() })),
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  });
}
