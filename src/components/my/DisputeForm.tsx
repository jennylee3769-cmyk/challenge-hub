"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";

const REASON_CODES = [
  { code: "D001", label: "인증 부당 반려" },
  { code: "D002", label: "상금 계산 오류" },
  { code: "D003", label: "챌린지 규칙 위반 (매니저)" },
  { code: "D004", label: "중복 인증 처리 오류" },
  { code: "D005", label: "기타" },
];

interface Props {
  participations: { id: string; title: string }[];
  defaultChallengeId?: string;
  defaultCertId?: string;
}

export function DisputeForm({ participations, defaultChallengeId, defaultCertId }: Props) {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState(defaultChallengeId ?? "");
  const [certificationId, setCertificationId] = useState(defaultCertId ?? "");
  const [reasonCode, setReasonCode] = useState("D001");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) { setError("챌린지를 선택해주세요"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          certificationId: certificationId || undefined,
          reasonCode,
          comment,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error === "dispute_already_open" ? "이미 동일한 이의신청이 진행 중입니다" : (data.error ?? "신청 실패"));
      }
      setSuccess(true);
      setTimeout(() => router.push("/my/disputes"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-[#ECFDF3] rounded-2xl p-5">
        <CheckCircle className="h-6 w-6 text-[#12B76A]" />
        <div>
          <p className="font-semibold text-[#027A48]">이의신청이 접수됐어요!</p>
          <p className="text-sm text-[#027A48]">3영업일 이내 처리됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 챌린지 선택 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#344054]">챌린지 선택 <span className="text-[#F04438]">*</span></label>
        <select
          value={challengeId}
          onChange={(e) => setChallengeId(e.target.value)}
          required
          className="w-full bg-white border border-[#D0D5DD] rounded-xl px-4 py-3 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#6172F3]"
        >
          <option value="">챌린지를 선택해주세요</option>
          {participations.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* 인증 ID (선택) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#344054]">인증 ID (선택)</label>
        <input
          value={certificationId}
          onChange={(e) => setCertificationId(e.target.value)}
          placeholder="특정 인증 건에 대한 이의신청인 경우 입력"
          className="w-full bg-white border border-[#D0D5DD] rounded-xl px-4 py-3 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#6172F3]"
        />
      </div>

      {/* 사유 선택 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#344054]">이의신청 사유 <span className="text-[#F04438]">*</span></label>
        <div className="grid grid-cols-1 gap-2">
          {REASON_CODES.map((r) => (
            <label key={r.code} className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setReasonCode(r.code)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  reasonCode === r.code ? "border-[#6172F3]" : "border-[#D0D5DD]"
                }`}
              >
                {reasonCode === r.code && <div className="w-2.5 h-2.5 rounded-full bg-[#6172F3]" />}
              </div>
              <span className="text-sm text-[#344054]">{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Textarea
        label="상세 내용"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={5}
        maxLength={1000}
        showCount
        placeholder="이의신청 사유를 구체적으로 작성해주세요 (최소 10자)"
        hint="증거 자료(스크린샷 등)가 있다면 함께 첨부하면 처리에 도움이 됩니다"
      />

      {error && (
        <div className="flex items-center gap-2 bg-[#FEE4E2] rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F04438]" />
          <p className="text-sm text-[#B42318]">{error}</p>
        </div>
      )}

      <Button type="submit" size="full" loading={loading} disabled={comment.length < 10}>
        이의신청 제출하기
      </Button>
    </form>
  );
}
