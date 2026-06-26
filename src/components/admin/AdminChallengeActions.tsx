"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  REVIEWING:  [{ label: "승인", next: "RECRUITING" }, { label: "반려", next: "CANCELLED" }],
  IN_PROGRESS:[{ label: "정산 처리", next: "settle" }],
};

export function AdminChallengeActions({ challengeId, status }: { challengeId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const actions = TRANSITIONS[status] ?? [];
  if (actions.length === 0) return null;

  const handleAction = async (next: string) => {
    setLoading(true);
    try {
      if (next === "settle") {
        await fetch(`/api/admin/challenges/${challengeId}/settle`, { method: "POST" });
      } else {
        await fetch(`/api/challenges/${challengeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {actions.map((a) => (
        <button
          key={a.next}
          onClick={() => handleAction(a.next)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC] disabled:opacity-50 font-medium"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
