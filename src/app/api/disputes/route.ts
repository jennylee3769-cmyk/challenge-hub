import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const REASON_CODES: Record<string, string> = {
  D001: "인증 부당 반려",
  D002: "상금 계산 오류",
  D003: "챌린지 규칙 위반 (매니저)",
  D004: "중복 인증 오류",
  D005: "기타",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // "my" | "admin"

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });

  const where =
    role === "admin" && user?.role === "ADMIN"
      ? {}
      : { userId: session.userId };

  const disputes = await db.dispute.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      challenge: { select: { id: true, title: true } },
      certification: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json(disputes);
}

const Schema = z.object({
  challengeId: z.string(),
  certificationId: z.string().optional(),
  reasonCode: z.string().refine((c) => c in REASON_CODES, "유효하지 않은 사유"),
  comment: z.string().min(10).max(1000),
  attachmentUrls: z.array(z.string().url()).max(5).default([]),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { challengeId, certificationId, reasonCode, comment, attachmentUrls } = parsed.data;

  // 챌린지 참가자인지 확인
  const participation = await db.participation.findUnique({
    where: { challengeId_userId: { challengeId, userId: session.userId } },
  });
  if (!participation) return NextResponse.json({ error: "not_participant" }, { status: 403 });

  // 동일 이의신청 중복 방지
  const existing = await db.dispute.findFirst({
    where: {
      userId: session.userId,
      challengeId,
      ...(certificationId && { certificationId }),
      status: "OPEN",
    },
  });
  if (existing) return NextResponse.json({ error: "dispute_already_open" }, { status: 409 });

  const dispute = await db.dispute.create({
    data: { challengeId, certificationId, userId: session.userId, reasonCode, comment, attachmentUrls },
  });

  return NextResponse.json(dispute, { status: 201 });
}
