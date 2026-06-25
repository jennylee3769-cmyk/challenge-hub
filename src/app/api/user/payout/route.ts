import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/encrypt";
import { registerPayoutSeller } from "@/lib/toss";
import { BANK_CODES } from "@/lib/toss";

const PayoutSchema = z.object({
  bankCode: z.string().refine((c) => c in BANK_CODES, "지원하지 않는 은행입니다"),
  accountNumber: z.string().min(10).max(16).regex(/^\d+$/, "숫자만 입력해주세요"),
  holderName: z.string().min(2).max(20),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PayoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { bankCode, accountNumber, holderName } = parsed.data;

  // 토스 지급대행 셀러 등록
  let payoutSellerId: string | undefined;
  try {
    const result = await registerPayoutSeller({
      sellerId: session.userId,
      bankCode,
      accountNumber,
      holderName,
    });
    payoutSellerId = result.sellerId;
  } catch (err: any) {
    // 개발 환경에서는 mock
    if (process.env.NODE_ENV !== "production") {
      payoutSellerId = `mock_${session.userId}`;
    } else {
      return NextResponse.json({ error: "payout_registration_failed", message: err.message }, { status: 500 });
    }
  }

  // 계좌번호 암호화 저장
  await db.user.update({
    where: { id: session.userId },
    data: {
      payoutSellerId,
      payoutBankCode: bankCode,
      payoutAccount: encrypt(accountNumber),
      payoutHolderName: holderName,
      payoutRegisteredAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, bankCode, holderName });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await db.user.update({
    where: { id: session.userId },
    data: {
      payoutSellerId: null,
      payoutBankCode: null,
      payoutAccount: null,
      payoutHolderName: null,
      payoutRegisteredAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
