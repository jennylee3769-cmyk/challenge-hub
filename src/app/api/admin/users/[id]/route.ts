import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const Schema = z.object({
  isBanned: z.boolean().optional(),
  role: z.enum(["USER", "MANAGER", "ADMIN"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (admin?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  const { isBanned, role } = parsed.data;

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(role !== undefined && { role: role as any }),
      // isBanned → deletedAt 방식으로 관리
      ...(isBanned === true && { deletedAt: new Date() }),
      ...(isBanned === false && { deletedAt: null }),
    },
    select: { id: true, role: true, deletedAt: true },
  });

  return NextResponse.json(updated);
}
