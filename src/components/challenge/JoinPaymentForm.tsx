"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, calcWithholding } from "@/lib/utils";
import Link from "next/link";

declare global {
  interface Window {
    TossPayments: any;
  }
}

interface Props {
  challengeId: string;
  entryFee: number;
  challengeTitle: string;
  userNickname: string;
  hasPayoutAccount: boolean;
}

export function JoinPaymentForm({ challengeId, entryFee, challengeTitle, userNickname, hasPayoutAccount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  // 무료 챌린지 즉시 참가
  const handleFreeJoin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "참가 실패");
      router.push(`/challenges/${challengeId}?joined=1`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 토스 결제창 실행
  const handleTossPayment = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. 주문 생성
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (!orderRes.ok) throw new Error((await orderRes.json()).error ?? "주문 생성 실패");
      const { orderId, amount, orderName } = await orderRes.json();

      // 2. 토스 SDK 로드 (CDN)
      if (!window.TossPayments) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js.tosspayments.com/v2/standard";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("토스 SDK 로드 실패"));
          document.head.appendChild(script);
        });
      }

      const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: `user_${Date.now()}` });

      // 3. 결제창 열기
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/api/payments/toss/success?challengeId=${challengeId}`,
        failUrl: `${window.location.origin}/challenges/${challengeId}/join?error=payment_failed`,
        customerName: userNickname,
      });
    } catch (err: any) {
      if (err.code !== "USER_CANCEL") setError(err.message ?? "결제에 실패했습니다");
      setLoading(false);
    }
  };

  if (entryFee === 0) {
    return (
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "bg-[#6172F3] border-[#6172F3]" : "border-[#D0D5DD]"}`}
          >
            {agreed && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-sm text-[#344054]">챌린지 규칙 및 이용약관에 동의합니다</span>
        </label>
        {error && (
          <div className="flex items-center gap-2 bg-[#FEE4E2] rounded-xl p-3">
            <AlertCircle className="h-4 w-4 text-[#F04438]" />
            <p className="text-sm text-[#B42318]">{error}</p>
          </div>
        )}
        <Button size="full" onClick={handleFreeJoin} loading={loading} disabled={!agreed}>
          무료로 참가하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 상금 수령 계좌 확인 */}
      {!hasPayoutAccount && (
        <div className="flex items-start gap-3 bg-[#FFFAEB] border border-[#FDB022]/30 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F79009] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-[#B54708] font-medium">상금 수령 계좌를 먼저 등록해주세요</p>
            <p className="text-xs text-[#B54708] mt-0.5">상금 지급을 위해 계좌 정보가 필요합니다</p>
            <Link href="/my/account" className="text-xs text-[#B54708] font-semibold underline mt-1 inline-block">
              계좌 등록하기 →
            </Link>
          </div>
        </div>
      )}

      {/* 원천징수 안내 */}
      {(() => {
        const wh = calcWithholding(entryFee * 20); // 20명 기준 추정
        return wh.tax > 0 ? (
          <div className="flex items-start gap-2 bg-[#F0F4FF] rounded-xl p-3">
            <AlertCircle className="h-4 w-4 text-[#6172F3] shrink-0 mt-0.5" />
            <p className="text-xs text-[#3538CD]">
              상금이 5만원을 초과하면 기타소득세 22%가 원천징수됩니다
            </p>
          </div>
        ) : null;
      })()}

      <div className="flex items-center justify-between py-3 border-t border-[#F2F4F7]">
        <span className="text-[#344054] font-medium">결제 금액</span>
        <span className="text-xl font-bold text-[#101828]">{formatMoney(entryFee)}</span>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <div
          onClick={() => setAgreed(!agreed)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "bg-[#6172F3] border-[#6172F3]" : "border-[#D0D5DD]"}`}
        >
          {agreed && <span className="text-white text-xs font-bold">✓</span>}
        </div>
        <span className="text-sm text-[#344054]">
          챌린지 규칙, 환불 정책, 이용약관에 동의합니다
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 bg-[#FEE4E2] rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F04438]" />
          <p className="text-sm text-[#B42318]">{error}</p>
        </div>
      )}

      <Button
        size="full"
        onClick={handleTossPayment}
        loading={loading}
        disabled={!agreed || !hasPayoutAccount}
        className="gap-2"
      >
        <CreditCard className="h-5 w-5" />
        {formatMoney(entryFee)} 결제하기
      </Button>
      <p className="text-xs text-center text-[#98A2B3]">토스페이먼츠로 안전하게 결제됩니다</p>
    </div>
  );
}
