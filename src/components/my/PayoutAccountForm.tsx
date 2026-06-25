"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  bankCodes: Record<string, string>;
}

export function PayoutAccountForm({ bankCodes }: Props) {
  const router = useRouter();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/payout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, accountNumber, holderName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-[#ECFDF3] rounded-2xl p-4">
        <CheckCircle className="h-5 w-5 text-[#12B76A]" />
        <div>
          <p className="text-sm font-semibold text-[#027A48]">계좌가 등록됐어요!</p>
          <p className="text-xs text-[#027A48]">이제 상금을 수령할 수 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 은행 선택 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#344054]">은행</label>
        <select
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          required
          className="w-full bg-white border border-[#D0D5DD] rounded-xl px-4 py-3 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#6172F3]"
        >
          <option value="">은행을 선택해주세요</option>
          {Object.entries(bankCodes).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      <Input
        label="계좌번호"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
        placeholder="-없이 숫자만 입력"
        required
        hint="본인 명의 계좌만 가능합니다"
        inputMode="numeric"
      />

      <Input
        label="예금주명"
        value={holderName}
        onChange={(e) => setHolderName(e.target.value)}
        placeholder="본인 이름을 입력해주세요"
        required
      />

      {error && (
        <div className="flex items-center gap-2 bg-[#FEE4E2] rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F04438]" />
          <p className="text-sm text-[#B42318]">{error}</p>
        </div>
      )}

      <Button type="submit" size="full" loading={loading}>
        계좌 등록하기
      </Button>
    </form>
  );
}
