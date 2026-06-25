import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { issueBillingKey, chargeBilling } from "@/lib/toss";
import { v4 as uuidv4 } from "uuid";

const PLANS = {
  STARTER: { price: 9900, label: "Starter" },
  PRO: { price: 29900, label: "Pro" },
} as const;

// 빌링키 등록 (카드 등록)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { authKey, plan } = z.object({
    authKey: z.string(),
    plan: z.enum(["STARTER", "PRO"]),
  }).parse(body);

  const customerKey = `sub_${session.userId}`;
  const planInfo = PLANS[plan];

  // 빌링키 발급
  let billingKey: string;
  let cardInfo: { cardCompany: string; cardNumber: string };
  try {
    const result = await issueBillingKey(authKey, customerKey);
    billingKey = result.billingKey;
    cardInfo = { cardCompany: result.cardCompany, cardNumber: result.cardNumber };
  } catch (err: any) {
    return NextResponse.json({ error: "billing_key_failed", message: err.message }, { status: 400 });
  }

  // 첫 결제
  const orderId = `SUB-${uuidv4().replace(/-/g, "").slice(0, 20)}`;
  try {
    await chargeBilling({
      billingKey,
      customerKey,
      amount: planInfo.price,
      orderId,
      orderName: `챌린지허브 ${planInfo.label} 구독`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "first_charge_failed", message: err.message }, { status: 400 });
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await db.managerSubscription.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      plan: plan as any,
      pgBillingKey: billingKey,
      amount: planInfo.price,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
    update: {
      plan: plan as any,
      pgBillingKey: billingKey,
      amount: planInfo.price,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  return NextResponse.json({ success: true, plan, nextBillingDate: nextMonth });
}

// 구독 해지
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await db.managerSubscription.updateMany({
    where: { userId: session.userId },
    data: { status: "CANCELLED", cancelAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
