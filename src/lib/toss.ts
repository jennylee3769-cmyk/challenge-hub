// 토스페이먼츠 API v2 래퍼
const TOSS_BASE = "https://api.tosspayments.com/v1";
const SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "";

function authHeader() {
  const encoded = Buffer.from(`${SECRET_KEY}:`).toString("base64");
  return { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" };
}

/** 결제 승인 */
export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const res = await fetch(`${TOSS_BASE}/payments/confirm`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new TossError(data.code, data.message);
  return data;
}

/** 결제 취소 (환불) */
export async function cancelPayment(paymentKey: string, cancelReason: string, cancelAmount?: number) {
  const res = await fetch(`${TOSS_BASE}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      cancelReason,
      ...(cancelAmount !== undefined && { cancelAmount }),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new TossError(data.code, data.message);
  return data;
}

/** 지급대행 셀러 등록 */
export async function registerPayoutSeller(params: {
  sellerId: string;     // 플랫폼 내 사용자 ID
  bankCode: string;
  accountNumber: string;
  holderName: string;
}) {
  const res = await fetch(`${TOSS_BASE}/brandpay/sellers`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      sellerId: params.sellerId,
      bankCode: params.bankCode,
      accountNumber: params.accountNumber,
      accountHolderName: params.holderName,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new TossError(data.code, data.message);
  return data as { sellerId: string };
}

/** 지급대행 출금 요청 */
export async function requestPayout(params: {
  sellerId: string;
  amount: number;
  orderId: string;
  orderName: string;
}) {
  const res = await fetch(`${TOSS_BASE}/brandpay/seller-payouts`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      sellerId: params.sellerId,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      currency: "KRW",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new TossError(data.code, data.message);
  return data as { payoutKey: string; status: string };
}

/** 빌링 자동결제 - 카드 등록 */
export async function issueBillingKey(authKey: string, customerKey: string) {
  const res = await fetch(`${TOSS_BASE}/billing/authorizations/issue`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ authKey, customerKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new TossError(data.code, data.message);
  return data as { billingKey: string; cardCompany: string; cardNumber: string };
}

/** 빌링 자동결제 실행 */
export async function chargeBilling(params: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}) {
  const res = await fetch(`${TOSS_BASE}/billing/${params.billingKey}`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      currency: "KRW",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new TossError(data.code, data.message);
  return data;
}

/** 웹훅 서명 검증 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const secret = process.env.TOSS_WEBHOOK_SECRET ?? "";
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return expected === signature;
}

export class TossError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "TossError";
  }
}

// 은행 코드 목록 (토스페이먼츠 기준)
export const BANK_CODES: Record<string, string> = {
  "004": "KB국민은행",
  "020": "우리은행",
  "088": "신한은행",
  "081": "하나은행",
  "003": "기업은행",
  "011": "농협은행",
  "023": "SC제일은행",
  "039": "경남은행",
  "034": "광주은행",
  "031": "대구은행",
  "032": "부산은행",
  "045": "새마을금고",
  "064": "산림조합",
  "007": "수협은행",
  "048": "신협",
  "071": "우체국",
  "050": "저축은행",
  "037": "전북은행",
  "035": "제주은행",
  "090": "카카오뱅크",
  "089": "케이뱅크",
  "092": "토스뱅크",
};
