"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDisputeActions({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState("");

  const handle = async (action: "APPROVE" | "REJECT" | "ESCALATE") => {
    setLoading(true);
    await fetch(`/api/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, resolvedMemo: memo }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="처리 메모 (선택)"
        className="w-full text-sm border border-[#D0D5DD] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#6172F3]"
      />
      <div className="flex gap-2">
        <button onClick={() => handle("APPROVE")} disabled={loading}
          className="flex-1 py-2 bg-[#ECFDF3] text-[#027A48] text-sm font-medium rounded-xl hover:bg-[#D1FAE5] disabled:opacity-50">
          승인
        </button>
        <button onClick={() => handle("REJECT")} disabled={loading}
          className="flex-1 py-2 bg-[#FEE4E2] text-[#B42318] text-sm font-medium rounded-xl disabled:opacity-50">
          반려
        </button>
        <button onClick={() => handle("ESCALATE")} disabled={loading}
          className="flex-1 py-2 bg-[#F2F4F7] text-[#344054] text-sm font-medium rounded-xl disabled:opacity-50">
          에스컬
        </button>
      </div>
    </div>
  );
}
