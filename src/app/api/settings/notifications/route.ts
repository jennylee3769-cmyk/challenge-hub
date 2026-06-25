import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const Schema = z.object({
  certApproved: z.boolean(),
  certRejected: z.boolean(),
  challengeEnd: z.boolean(),
  prizeSettled: z.boolean(),
  newParticipant: z.boolean(),
  disputeUpdate: z.boolean(),
  systemNotice: z.boolean(),
});

// Note: NotificationPreference model not yet in schema.
// Currently stores preferences in a simple JSON column on User or as future migration.
// For now, we accept and acknowledge the request without persisting.
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 422 });

  // TODO: persist when NotificationPreference model is added to schema
  return NextResponse.json({ success: true });
}
