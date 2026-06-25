import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: challengeId } = await params;

  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: { id: true, certSuccessPct: true, certFrequency: true, certFrequencyN: true, status: true },
  });
  if (!challenge) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const participations = await db.participation.findMany({
    where: { challengeId },
    orderBy: [{ score: "desc" }, { certCount: "desc" }, { joinedAt: "asc" }],
    include: {
      user: { select: { id: true, nickname: true, profileImageUrl: true } },
    },
  });

  const ranked = participations.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    nickname: p.user.nickname,
    profileImageUrl: p.user.profileImageUrl,
    certCount: p.certCount,
    score: p.score,
    status: p.status,
    maxStreak: p.maxStreak,
    likedReceived: p.likedReceived,
  }));

  return NextResponse.json({ data: ranked, total: ranked.length });
}
