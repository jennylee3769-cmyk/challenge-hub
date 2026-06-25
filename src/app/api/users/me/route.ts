import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const Schema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  profileImageUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const { nickname, profileImageUrl } = parsed.data;

  // 닉네임 중복 체크
  if (nickname) {
    const existing = await db.user.findFirst({
      where: { nickname, id: { not: session.userId } },
    });
    if (existing) return NextResponse.json({ error: "nickname_taken" }, { status: 409 });
  }

  const updated = await db.user.update({
    where: { id: session.userId },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(profileImageUrl !== undefined && { profileImageUrl }),
    },
    select: { id: true, nickname: true, profileImageUrl: true },
  });

  return NextResponse.json(updated);
}
