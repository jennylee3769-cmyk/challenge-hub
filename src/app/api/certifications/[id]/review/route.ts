import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendCertRejected } from "@/lib/ses";

const ReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectCode: z.string().optional(),
  rejectMemo: z.string().max(200).optional(),
});

const REJECT_CODES: Record<string, string> = {
  R001: "오늘 날짜의 콘텐츠가 아님",
  R002: "URL이 유효하지 않음",
  R003: "필수 해시태그 미포함",
  R004: "중복 인증",
  R005: "챌린지 내용과 무관",
  R006: "이미지 품질 불량",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: certId } = await params;

  const cert = await db.certification.findUnique({
    where: { id: certId },
    include: {
      challenge: { select: { managerId: true, title: true } },
      user: { select: { email: true, nickname: true } },
    },
  });

  if (!cert) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (cert.challenge.managerId !== session.userId) {
    // 어드민도 허용
    const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (cert.status !== "PENDING") return NextResponse.json({ error: "already_reviewed" }, { status: 400 });

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const { action, rejectCode, rejectMemo } = parsed.data;

  const updated = await db.certification.update({
    where: { id: certId },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      rejectCode: action === "REJECT" ? rejectCode : null,
      rejectMemo: action === "REJECT" ? rejectMemo : null,
      reviewedAt: new Date(),
      reviewedBy: session.userId,
    },
  });

  // 반려 시 이메일 발송
  if (action === "REJECT" && cert.user.email) {
    const reason = rejectCode ? (REJECT_CODES[rejectCode] ?? rejectCode) : (rejectMemo ?? "규정 위반");
    sendCertRejected({
      to: cert.user.email,
      nickname: cert.user.nickname,
      challengeTitle: cert.challenge.title,
      certId,
      rejectReason: reason,
    }).catch(console.error);
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
