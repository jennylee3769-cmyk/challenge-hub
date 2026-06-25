"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface JoinButtonProps {
  challengeId: string;
  entryFee: number;
  isParticipating: boolean;
  isLoggedIn: boolean;
  recruitEndsAt: string;
  dday: string;
}

export function JoinButton({
  challengeId,
  entryFee,
  isParticipating,
  isLoggedIn,
  recruitEndsAt,
  dday,
}: JoinButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isExpired = new Date(recruitEndsAt) < new Date();

  if (isExpired) {
    return (
      <Button size="full" variant="secondary" disabled>
        모집 마감됨
      </Button>
    );
  }

  if (isParticipating) {
    return (
      <Button size="full" variant="secondary" disabled>
        ✓ 참가 중
      </Button>
    );
  }

  const handleJoin = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/challenges/${challengeId}`);
      return;
    }
    // 유료 챌린지는 결제 페이지로, 무료는 바로 참가
    if (entryFee > 0) {
      router.push(`/challenges/${challengeId}/join`);
    } else {
      router.push(`/challenges/${challengeId}/join`);
    }
  };

  return (
    <Button size="full" onClick={handleJoin} loading={loading}>
      {entryFee > 0
        ? `${formatMoney(entryFee)} 결제하고 참가 · ${dday}`
        : `무료로 참가하기 · ${dday}`}
    </Button>
  );
}
