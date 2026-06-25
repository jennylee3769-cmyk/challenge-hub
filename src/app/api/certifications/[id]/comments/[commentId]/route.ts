import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { commentId } = await params;

  const comment = await db.certificationComment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isOwner = comment.userId === session.userId;
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await db.certificationComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });

  return NextResponse.json({ success: true });
}
