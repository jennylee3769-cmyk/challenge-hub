import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 일반 사용자 → 매니저 전환
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (user.role !== "USER") return NextResponse.json({ error: "already_manager" }, { status: 400 });

  await db.$transaction([
    db.user.update({ where: { id: session.userId }, data: { role: "MANAGER" } }),
    db.managerSubscription.create({
      data: { userId: session.userId, plan: "FREE", status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({ success: true, role: "MANAGER" });
}
