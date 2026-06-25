import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: certificationId } = await params;

  const cert = await db.certification.findUnique({
    where: { id: certificationId },
    select: { id: true, status: true, userId: true },
  });
  if (!cert) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (cert.status !== "APPROVED") return NextResponse.json({ error: "not_approved" }, { status: 400 });

  try {
    await db.certificationLike.create({
      data: { certificationId, userId: session.userId },
    });
    // 참가자 likedReceived 증가
    await db.participation.updateMany({
      where: { challengeId: cert.userId, userId: cert.userId },
      data: { likedReceived: { increment: 1 } },
    });
    const count = await db.certificationLike.count({ where: { certificationId } });
    return NextResponse.json({ liked: true, count }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "already_liked" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: certificationId } = await params;

  await db.certificationLike.deleteMany({
    where: { certificationId, userId: session.userId },
  });

  const count = await db.certificationLike.count({ where: { certificationId } });
  return NextResponse.json({ liked: false, count });
}
