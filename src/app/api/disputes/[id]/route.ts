import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ResolveSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "ESCALATE"]),
  resolvedMemo: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });

  // 챌린지 매니저 또는 어드민만 처리 가능
  const { id } = await params;
  const dispute = await db.dispute.findUnique({
    where: { id },
    include: { challenge: { select: { managerId: true } } },
  });
  if (!dispute) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isManager = dispute.challenge.managerId === session.userId;
  const isAdmin = user?.role === "ADMIN";
  if (!isManager && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (dispute.status !== "OPEN") return NextResponse.json({ error: "already_resolved" }, { status: 400 });

  const body = await req.json();
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const statusMap = { APPROVE: "APPROVED", REJECT: "REJECTED", ESCALATE: "ESCALATED" } as const;

  const updated = await db.dispute.update({
    where: { id },
    data: {
      status: statusMap[parsed.data.action],
      resolvedBy: session.userId,
      resolvedMemo: parsed.data.resolvedMemo,
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
