import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 매니저가 관리하는 챌린지들의 인증 목록
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";
  const challengeId = searchParams.get("challengeId");

  // 이 매니저 소유의 챌린지 IDs
  const managerChallenges = await db.challenge.findMany({
    where: { managerId: session.userId },
    select: { id: true },
  });
  const challengeIds = managerChallenges.map((c) => c.id);

  const certs = await db.certification.findMany({
    where: {
      challengeId: challengeId ? challengeId : { in: challengeIds },
      status: status as any,
    },
    orderBy: { submittedAt: "asc" },
    take: 50,
    include: {
      user: { select: { nickname: true, profileImageUrl: true } },
      challenge: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(certs);
}
