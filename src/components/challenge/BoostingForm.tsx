"use client";

import { useState } from "react";
import { Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

const PLANS = [
  { key: "S", label: "3일 노출", price: 9900, desc: "주말 포함 3일간 목록 상단 노출" },
  { key: "M", label: "7일 노출", price: 19900, desc: "1주일간 목록 상단 노출 + 추천 배지" },
  { key: "L", label: "14일 노출", price: 34900, desc: "2주간 목록 최상단 + 홈 Featured 노출" },
] as const;

declare global {
  interface Window { TossPayments: any }
}

export function BoostingForm({ challengeId }: { challengeId: string }) {
  const [selected, setSelected] = useState<"S" | "M" | "L">("M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const plan = PLANS.find((p) => p.key === selected)!;

  const handlePurchase = async () => {
    setLoading(true);
    setError("");
    try {
      if (!window.TossPayments) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://js.tosspayments.com/v2/standard";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("토스 SDK 로드 실패"));
          document.head.appendChild(s);
        });
      }

      const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: `boost_${Date.now()}` });

      const orderId = `BOOST-${challengeId}-${Date.now()}`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: plan.price },
        orderId,
        orderName: `챌린지 부스팅 ${plan.label}`,
        successUrl: `${window.location.origin}/api/boostings/callback?challengeId=${challengeId}&plan=${selected}`,
        failUrl: `${window.location.origin}/manage/challenges/${challengeId}/boost?error=payment_failed`,
      });
    } catch (err: any) {
      if (err.code !== "USER_CANCEL") setError(err.message ?? "결제 오류");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-[#ECFDF3] rounded-2xl p-5">
        <CheckCircle className="h-6 w-6 text-[#12B76A]" />
        <p className="font-semibold text-[#027A48]">부스팅이 시작됐어요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {PLANS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setSelected(p.key)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${
              selected === p.key
                ? "border-[#6172F3] bg-[#F5F6FE]"
                : "border-[#F2F4F7] bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${selected === p.key ? "text-[#6172F3]" : "text-[#98A2B3]"}`} />
                <span className="font-semibold text-[#101828]">{p.label}</span>
              </div>
              <span className={`font-bold ${selected === p.key ? "text-[#6172F3]" : "text-[#344054]"}`}>
                {formatMoney(p.price)}
              </span>
            </div>
            <p className="text-sm text-[#667085] ml-6">{p.desc}</p>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-[#F04438]">{error}</p>}

      <Button size="full" onClick={handlePurchase} loading={loading} className="gap-2">
        <Zap className="h-5 w-5" />
        {formatMoney(plan.price)} 결제하고 부스팅 시작
      </Button>
      <p className="text-xs text-center text-[#98A2B3]">결제 후 즉시 노출이 시작됩니다</p>
    </div>
  );
}
