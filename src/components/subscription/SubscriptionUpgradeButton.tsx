"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  plan: "STARTER" | "PRO" | "FREE";
  label: string;
  variant?: "primary" | "secondary";
}

declare global {
  interface Window { TossPayments: any }
}

export function SubscriptionUpgradeButton({ plan, label, variant = "primary" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    // 해지
    if (plan === "FREE") {
      if (!confirm("구독을 해지하시겠습니까? 현재 기간 종료 후 Free 플랜으로 전환됩니다.")) return;
      setLoading(true);
      await fetch("/api/subscriptions/upgrade", { method: "DELETE" });
      router.refresh();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Toss 빌링키 발급
      if (!window.TossPayments) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://js.tosspayments.com/v2/standard";
          s.onload = () => resolve();
          s.onerror = () => reject();
          document.head.appendChild(s);
        });
      }

      const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      const payment = toss.payment({ customerKey: `billing_${Date.now()}` });

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/api/subscriptions/billing-callback?plan=${plan}`,
        failUrl: `${window.location.origin}/subscription?error=billing_failed`,
      });
    } catch (err: any) {
      if (err?.code !== "USER_CANCEL") {
        alert("결제 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setLoading(false);
    }
  };

  return (
    <Button size="full" variant={variant} onClick={handleClick} loading={loading}>
      {label}
    </Button>
  );
}
