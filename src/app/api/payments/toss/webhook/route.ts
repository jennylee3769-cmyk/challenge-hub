import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, requestPayout } from "@/lib/toss";
import { calcWithholding } from "@/lib/utils";
import { sendSettlementComplete } from "@/lib/ses";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("toss-signature") ?? "";
  const body = await req.text();

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const { eventType, data } = event;

  if (eventType === "PAYMENT_STATUS_CHANGED") {
    const { paymentKey, orderId, status } = data;
    if (status === "DONE") {
      await db.payment.updateMany({
        where: { pgOrderId: orderId },
        data: { status: "COMPLETED", pgPaymentKey: paymentKey, completedAt: new Date() },
      });
    } else if (status === "CANCELED") {
      await db.payment.updateMany({
        where: { pgOrderId: orderId },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ received: true });
}
