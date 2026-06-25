import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: certificationId } = await params;

  const comments = await db.certificationComment.findMany({
    where: { certificationId, isDeleted: false },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, nickname: true, profileImageUrl: true } } },
  });

  return NextResponse.json(comments);
}

const Schema = z.object({ content: z.string().min(1).max(300) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: certificationId } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const comment = await db.certificationComment.create({
    data: { certificationId, userId: session.userId, content: parsed.data.content },
    include: { user: { select: { id: true, nickname: true, profileImageUrl: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
