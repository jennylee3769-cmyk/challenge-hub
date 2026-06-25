import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const challenge = await db.challenge.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, nickname: true, profileImageUrl: true } },
      _count: { select: { participations: true, certifications: true } },
      boostings: { where: { status: "ACTIVE" }, take: 1 },
    },
  });

  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    ...challenge,
    startsAt: challenge.startsAt.toISOString(),
    endsAt: challenge.endsAt.toISOString(),
    recruitEndsAt: challenge.recruitEndsAt.toISOString(),
    isBoosted: challenge.boostings.length > 0,
  });
}

const PatchSchema = z.object({
  title: z.string().min(2).max(50).optional(),
  description: z.string().min(10).max(1000).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  hashtags: z.array(z.string()).optional(),
}).strict();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const challenge = await db.challenge.findUnique({ where: { id }, select: { managerId: true, status: true } });

  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (challenge.managerId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // 진행 중 이후에는 설명과 커버만 수정 가능
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const allowedInProgress = ["description", "coverImageUrl"];
  const keys = Object.keys(parsed.data);
  if (challenge.status === "IN_PROGRESS" && keys.some((k) => !allowedInProgress.includes(k))) {
    return NextResponse.json({ error: "cannot_modify_during_progress" }, { status: 400 });
  }
  if (["REVIEWING", "COMPLETED", "CANCELLED"].includes(challenge.status)) {
    return NextResponse.json({ error: "challenge_locked" }, { status: 400 });
  }

  const updated = await db.challenge.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const challenge = await db.challenge.findUnique({
    where: { id },
    select: { managerId: true, status: true, _count: { select: { participations: true } } },
  });

  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (challenge.managerId !== session.userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (challenge._count.participations > 0) {
    return NextResponse.json({ error: "cannot_delete_with_participants" }, { status: 400 });
  }

  await db.challenge.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ success: true });
}
