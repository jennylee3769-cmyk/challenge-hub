import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateInviteCode } from "@/lib/utils";

const CreateSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().min(10).max(1000),
  channelType: z.enum(["BLOG", "YOUTUBE", "FREE"]),
  category: z.enum(["EXERCISE", "STUDY", "READING", "FINANCE", "DIET", "CREATION", "PRODUCTIVITY", "OTHER"]),
  hashtags: z.array(z.string()).default([]),
  startsAt: z.string(),
  endsAt: z.string(),
  recruitEndsAt: z.string(),
  certFrequency: z.enum(["DAILY", "WEEKLY_N", "TOTAL_N"]),
  certFrequencyN: z.number().optional(),
  certDailyDeadline: z.string().default("23:59"),
  certSuccessPct: z.number().min(50).max(100),
  entryFee: z.number().min(0),
  managerFeePct: z.number().min(0).max(30),
  rewardModel: z.enum(["EQUAL", "PROPORTIONAL", "COMPLETION_BONUS", "RANK", "REFUND"]),
  reviewMode: z.enum(["MANUAL", "AUTO_WITH_EXCEPTION"]).default("AUTO_WITH_EXCEPTION"),
  requiredHashtags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
  disputePeriodDays: z.number().min(3).max(14).default(5),
  minParticipants: z.number().optional(),
  maxParticipants: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role === "USER") {
    return NextResponse.json({ error: "manager_required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;

  // 날짜 유효성 검사
  const recruitEndsAt = new Date(d.recruitEndsAt);
  const startsAt = new Date(d.startsAt);
  const endsAt = new Date(d.endsAt);

  if (recruitEndsAt >= startsAt) {
    return NextResponse.json({ error: "recruit_must_end_before_start" }, { status: 422 });
  }
  if (startsAt >= endsAt) {
    return NextResponse.json({ error: "start_must_be_before_end" }, { status: 422 });
  }

  const challenge = await db.challenge.create({
    data: {
      managerId: session.userId,
      title: d.title,
      description: d.description,
      channelType: d.channelType,
      category: d.category,
      hashtags: d.hashtags,
      status: "RECRUITING",
      startsAt,
      endsAt,
      recruitEndsAt,
      certFrequency: d.certFrequency,
      certFrequencyN: d.certFrequencyN,
      certDailyDeadline: d.certDailyDeadline,
      certSuccessPct: d.certSuccessPct,
      entryFee: d.entryFee,
      managerFeePct: d.managerFeePct,
      rewardModel: d.rewardModel,
      reviewMode: d.reviewMode,
      requiredHashtags: d.requiredHashtags,
      isPublic: d.isPublic,
      disputePeriodDays: d.disputePeriodDays,
      minParticipants: d.minParticipants,
      maxParticipants: d.maxParticipants,
      inviteCode: !d.isPublic ? generateInviteCode() : null,
    },
  });

  return NextResponse.json({ id: challenge.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const channel = searchParams.get("channel");
  const sort = searchParams.get("sort") ?? "recent";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const challenges = await db.challenge.findMany({
    where: {
      status: { in: ["RECRUITING", "IN_PROGRESS"] },
      isPublic: true,
      ...(category && { category: category as any }),
      ...(channel && { channelType: channel as any }),
      ...(cursor && { id: { lt: cursor } }),
    },
    orderBy:
      sort === "popular" ? [{ boostings: { _count: "desc" } }, { participations: { _count: "desc" } }]
        : sort === "prize" ? [{ entryFee: "desc" }]
        : [{ createdAt: "desc" }],
    take: limit + 1,
    include: {
      manager: { select: { id: true, nickname: true, profileImageUrl: true } },
      _count: { select: { participations: true } },
      boostings: { where: { status: "ACTIVE" }, take: 1 },
    },
  });

  const hasMore = challenges.length > limit;
  const data = hasMore ? challenges.slice(0, limit) : challenges;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({
    data: data.map((c) => ({
      ...c,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      recruitEndsAt: c.recruitEndsAt.toISOString(),
      isBoosted: c.boostings.length > 0,
    })),
    nextCursor,
    hasMore,
  });
}
