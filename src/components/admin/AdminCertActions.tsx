"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export function AdminCertActions({ certId }: { certId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState("");
  const [showReject, setShowReject] = useState(false);

  const approve = async () => {
    setLoading(true);
    await fetch(`/api/certifications/${certId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    router.refresh();
    setLoading(false);
  };

  const reject = async () => {
    if (!memo.trim()) return;
    setLoading(true);
    await fetch(`/api/certifications/${certId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT", rejectMemo: memo }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      {showReject && (
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="반려 사유 입력..."
          className="w-full text-sm border border-[#D0D5DD] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#F04438]"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#ECFDF3] text-[#027A48] text-sm font-medium rounded-xl hover:bg-[#D1FAE5] disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> 승인
        </button>
        {!showReject ? (
          <button
            onClick={() => setShowReject(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#FEE4E2] text-[#B42318] text-sm font-medium rounded-xl hover:bg-[#FEE4E2]/80"
          >
            <X className="h-4 w-4" /> 반려
          </button>
        ) : (
          <>
            <button
              onClick={reject}
              disabled={loading || !memo.trim()}
              className="flex-1 py-2 bg-[#F04438] text-white text-sm font-medium rounded-xl disabled:opacity-50"
            >
              반려 확인
            </button>
            <button
              onClick={() => { setShowReject(false); setMemo(""); }}
              className="px-3 py-2 text-[#98A2B3] text-sm"
            >
              취소
            </button>
          </>
        )}
      </div>
    </div>
  );
}
