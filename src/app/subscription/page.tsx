import { redirect } from "next/navigation";
import { CheckCircle, Star, Zap, Crown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { SubscriptionUpgradeButton } from "@/components/subscription/SubscriptionUpgradeButton";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    iconName: "star",
    price: 0,
    features: ["챌린지 1개", "참가자 최대 30명", "기본 인증 관리", "플랫폼 수수료 7%"],
  },
  {
    key: "STARTER",
    name: "Starter",
    iconName: "zap",
    price: 9900,
    features: ["챌린지 5개", "참가자 최대 100명", "우선 노출", "플랫폼 수수료 5%", "상세 통계"],
    recommended: true,
  },
  {
    key: "PRO",
    name: "Pro",
    iconName: "crown",
    price: 29900,
    features: ["챌린지 무제한", "참가자 무제한", "상단 고정 노출", "플랫폼 수수료 3%", "전용 CS 지원", "자동 정산"],
  },
];

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentPlan = user.subscription?.plan ?? "FREE";
  const periodEnd = (user.subscription as any)?.currentPeriodEnd as Date | null | undefined;

  return (
    <>
      <Header title="구독 관리" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto space-y-5">
        {/* 현재 구독 */}
        <div className="bg-[#F0F4FF] rounded-2xl p-4">
          <p className="text-xs text-[#6172F3] font-medium mb-1">현재 구독</p>
          <p className="text-xl font-bold text-[#101828]">{currentPlan} 플랜</p>
          {periodEnd && (
            <p className="text-sm text-[#667085] mt-0.5">
              다음 결제일: {formatDate(periodEnd)}
            </p>
          )}
        </div>

        {/* 플랜 카드 */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.key === currentPlan;
            const Icon = plan.iconName === "zap" ? Zap : plan.iconName === "crown" ? Crown : Star;
            const iconColor = plan.iconName === "zap" ? "text-[#6172F3]" : plan.iconName === "crown" ? "text-[#F79009]" : "text-[#98A2B3]";
            return (
              <div
                key={plan.key}
                className={`rounded-2xl p-4 border-2 transition-colors ${
                  plan.recommended
                    ? "border-[#6172F3] bg-[#F5F6FE]"
                    : isCurrentPlan
                    ? "border-[#6172F3]/50 bg-white"
                    : "border-[#F2F4F7] bg-white"
                }`}
              >
                {plan.recommended && (
                  <span className="text-xs bg-[#6172F3] text-white px-2 py-0.5 rounded-full font-medium mb-2 inline-block">
                    추천
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                  <div>
                    <p className="font-bold text-[#101828]">{plan.name}</p>
                    <p className="text-sm text-[#667085]">
                      {plan.price === 0 ? "무료" : `월 ${plan.price.toLocaleString("ko-KR")}원`}
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#344054]">
                      <CheckCircle className="h-4 w-4 text-[#12B76A] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button variant="secondary" size="full" disabled>현재 플랜</Button>
                ) : plan.price === 0 ? (
                  <SubscriptionUpgradeButton plan="FREE" label="다운그레이드 (해지)" variant="secondary" />
                ) : (
                  <SubscriptionUpgradeButton
                    plan={plan.key as "STARTER" | "PRO"}
                    label="업그레이드"
                    variant={plan.recommended ? "primary" : "secondary"}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-[#98A2B3]">
          구독은 매월 자동 갱신되며 언제든 해지할 수 있습니다
        </p>
      </main>
    </>
  );
}
