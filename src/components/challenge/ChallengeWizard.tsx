"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatMoney, simulatePrize } from "@/lib/utils";
import {
  CATEGORY_LABELS, CHANNEL_LABELS, REWARD_MODEL_LABELS,
  type WizardData, type ChallengeCategory, type ChannelType, type RewardModel,
} from "@/types";

const STEPS = ["기본 정보", "일정·인증", "참가비·상금", "검토 설정", "확인·공개"];
const TOTAL = STEPS.length;

interface Props { managerId: string; }

const defaultData: WizardData = {
  title: "", description: "", category: "", channelType: "", hashtags: [],
  startsAt: "", endsAt: "", recruitEndsAt: "", certFrequency: "DAILY",
  certDailyDeadline: "23:59", certSuccessPct: 80,
  entryFee: 0, isFree: true, managerFeePct: 0, rewardModel: "EQUAL",
  reviewMode: "AUTO_WITH_EXCEPTION", requiredHashtags: [],
  isPublic: true, disputePeriodDays: 5,
  agreedToRefundPolicy: false, agreedToWithholding: false, agreedToTerms: false,
};

export function ChallengeWizard({ managerId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardData, string>>>({});
  const [tagInput, setTagInput] = useState("");

  const update = (fields: Partial<WizardData>) => setData((d) => ({ ...d, ...fields }));

  // ── STEP 1 ──────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      <Input
        label="챌린지 제목"
        required
        placeholder="예: 30일 블로그 챌린지"
        value={data.title}
        onChange={(e) => update({ title: e.target.value })}
        error={errors.title}
        maxLength={50}
      />

      <Textarea
        label="챌린지 소개"
        required
        placeholder="챌린지 목표와 규칙을 설명해주세요"
        value={data.description}
        onChange={(e) => update({ description: e.target.value })}
        rows={4}
        showCount
        maxLength={1000}
        error={errors.description}
      />

      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">
          채널 유형 <span className="text-[#F04438]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(CHANNEL_LABELS) as [ChannelType, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ channelType: key })}
              className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                data.channelType === key
                  ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]"
                  : "border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.channelType && <p className="text-sm text-[#F04438] mt-1">{errors.channelType}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">
          카테고리 <span className="text-[#F04438]">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(CATEGORY_LABELS) as [ChallengeCategory, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ category: key })}
              className={`py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                data.category === key
                  ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]"
                  : "border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.category && <p className="text-sm text-[#F04438] mt-1">{errors.category}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">해시태그</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value.replace(/[^a-zA-Z0-9가-힣_]/g, ""))}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && tagInput.trim()) {
                e.preventDefault();
                if (data.hashtags.length < 10) {
                  update({ hashtags: [...data.hashtags, tagInput.trim()] });
                  setTagInput("");
                }
              }
            }}
            placeholder="태그 입력 후 Enter"
            className="flex-1 h-11 rounded-lg border border-[#D0D5DD] px-3.5 text-sm focus:border-[#6172F3] focus:outline-none focus:ring-4 focus:ring-[#E0EAFF]"
          />
        </div>
        {data.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.hashtags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 bg-[#F0F4FF] text-[#6172F3] text-sm px-3 py-1 rounded-full">
                #{tag}
                <button onClick={() => update({ hashtags: data.hashtags.filter((t) => t !== tag) })} className="text-[#98A2B3] hover:text-[#F04438]">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── STEP 2 ──────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-5">
      <Input label="모집 마감일" type="date" required value={data.recruitEndsAt}
        onChange={(e) => update({ recruitEndsAt: e.target.value })} error={errors.recruitEndsAt} />
      <Input label="챌린지 시작일" type="date" required value={data.startsAt}
        onChange={(e) => update({ startsAt: e.target.value })} error={errors.startsAt} />
      <Input label="챌린지 종료일" type="date" required value={data.endsAt}
        onChange={(e) => update({ endsAt: e.target.value })} error={errors.endsAt} />

      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">
          인증 주기 <span className="text-[#F04438]">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "DAILY", label: "매일" },
            { key: "WEEKLY_N", label: "주 N회" },
            { key: "TOTAL_N", label: "총 N회" },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => update({ certFrequency: key as any })}
              className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                data.certFrequency === key
                  ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]"
                  : "border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(data.certFrequency === "WEEKLY_N" || data.certFrequency === "TOTAL_N") && (
        <Input label={data.certFrequency === "WEEKLY_N" ? "주 몇 회" : "총 몇 회"} type="number"
          min={1} max={99} value={data.certFrequencyN ?? ""}
          onChange={(e) => update({ certFrequencyN: Number(e.target.value) })} />
      )}

      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">
          성공 기준 (달성률 %) <span className="text-[#F04438]">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[60, 70, 80, 100].map((pct) => (
            <button key={pct} type="button"
              onClick={() => update({ certSuccessPct: pct })}
              className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                data.certSuccessPct === pct
                  ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]"
                  : "border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="최소 인원" type="number" min={1} placeholder="제한 없음"
          value={data.minParticipants ?? ""}
          onChange={(e) => update({ minParticipants: e.target.value ? Number(e.target.value) : undefined })} />
        <Input label="최대 인원" type="number" min={1} placeholder="제한 없음"
          value={data.maxParticipants ?? ""}
          onChange={(e) => update({ maxParticipants: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
    </div>
  );

  // ── STEP 3 ──────────────────────────────────────────────
  const mockPrize = simulatePrize({
    entryFee: data.entryFee,
    participantCount: 20,
    managerFeePct: data.managerFeePct,
    platformFeePct: 0.07,
  });

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">참가비</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button type="button"
            onClick={() => update({ isFree: true, entryFee: 0 })}
            className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
              data.isFree ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]" : "border-[#D0D5DD] text-[#344054]"
            }`}
          >
            무료
          </button>
          <button type="button"
            onClick={() => update({ isFree: false, entryFee: data.entryFee || 5000 })}
            className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
              !data.isFree ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]" : "border-[#D0D5DD] text-[#344054]"
            }`}
          >
            유료
          </button>
        </div>

        {!data.isFree && (
          <Input type="number" min={1000} step={1000}
            suffix="원"
            placeholder="5000"
            value={data.entryFee || ""}
            onChange={(e) => update({ entryFee: Number(e.target.value) })}
            hint="최소 1,000원"
            error={errors.entryFee}
          />
        )}
      </div>

      {!data.isFree && (
        <>
          <div>
            <label className="text-sm font-medium text-[#344054] mb-1.5 block">
              매니저 수수료 (0~30%)
            </label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={30} step={5}
                value={data.managerFeePct}
                onChange={(e) => update({ managerFeePct: Number(e.target.value) })}
                className="flex-1 accent-[#6172F3]"
              />
              <span className="text-sm font-bold text-[#344054] w-10 text-right">{data.managerFeePct}%</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#344054] mb-1.5 block">상금 지급 방식</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(REWARD_MODEL_LABELS) as [RewardModel, string][]).map(([key, label]) => (
                <button key={key} type="button"
                  onClick={() => update({ rewardModel: key })}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors ${
                    data.rewardModel === key
                      ? "border-[#6172F3] bg-[#F0F4FF] text-[#6172F3]"
                      : "border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 상금 시뮬레이션 (참가자 20명 기준) */}
          <div className="bg-[#FFFAEB] rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-[#344054] mb-2">💰 상금 미리보기 (20명 기준)</p>
            <div className="flex justify-between text-[#667085]">
              <span>총 참가비</span><span>{formatMoney(mockPrize.totalPool)}</span>
            </div>
            <div className="flex justify-between text-[#667085]">
              <span>플랫폼 수수료</span><span>- {formatMoney(mockPrize.platformFee)}</span>
            </div>
            <div className="flex justify-between text-[#667085]">
              <span>매니저 수수료</span><span>- {formatMoney(mockPrize.managerFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#F79009] border-t border-[#FDB022]/30 pt-2">
              <span>상금 풀</span><span>{formatMoney(mockPrize.prizePool)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── STEP 4 ──────────────────────────────────────────────
  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">인증 검토 방식</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { key: "AUTO_WITH_EXCEPTION", label: "자동 검토 (이상 감지 시 수동)", desc: "AI가 자동 승인, 중복·이상 인증은 매니저 검토" },
            { key: "MANUAL", label: "전체 수동 검토", desc: "매니저가 모든 인증을 직접 확인" },
          ].map(({ key, label, desc }) => (
            <button key={key} type="button"
              onClick={() => update({ reviewMode: key as any })}
              className={`py-3 px-4 rounded-xl border text-left transition-colors ${
                data.reviewMode === key
                  ? "border-[#6172F3] bg-[#F0F4FF]"
                  : "border-[#D0D5DD] hover:bg-[#F9FAFB]"
              }`}
            >
              <p className={`text-sm font-medium ${data.reviewMode === key ? "text-[#6172F3]" : "text-[#344054]"}`}>{label}</p>
              <p className="text-xs text-[#98A2B3] mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[#344054] mb-1.5 block">필수 해시태그 (인증 시 포함 필요)</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value.replace(/[^a-zA-Z0-9가-힣_]/g, ""))}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && tagInput.trim()) {
                e.preventDefault();
                update({ requiredHashtags: [...data.requiredHashtags, tagInput.trim()] });
                setTagInput("");
              }
            }}
            placeholder="예: 운동챌린지"
            className="flex-1 h-11 rounded-lg border border-[#D0D5DD] px-3.5 text-sm focus:border-[#6172F3] focus:outline-none focus:ring-4 focus:ring-[#E0EAFF]"
          />
        </div>
        {data.requiredHashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.requiredHashtags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 bg-[#F0F4FF] text-[#6172F3] text-sm px-3 py-1 rounded-full">
                #{tag}
                <button onClick={() => update({ requiredHashtags: data.requiredHashtags.filter((t) => t !== tag) })} className="text-[#98A2B3] hover:text-[#F04438]">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between py-3 border-t border-[#F2F4F7]">
        <div>
          <p className="text-sm font-medium text-[#344054]">공개 챌린지</p>
          <p className="text-xs text-[#98A2B3]">비공개 시 초대 링크로만 참가 가능</p>
        </div>
        <button
          type="button"
          onClick={() => update({ isPublic: !data.isPublic })}
          className={`w-12 h-6 rounded-full transition-colors relative ${data.isPublic ? "bg-[#6172F3]" : "bg-[#D0D5DD]"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.isPublic ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );

  // ── STEP 5 ──────────────────────────────────────────────
  const renderStep5 = () => (
    <div className="space-y-5">
      <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2 text-sm">
        <h3 className="font-bold text-[#101828] mb-3">최종 확인</h3>
        {[
          { label: "제목", value: data.title },
          { label: "채널", value: CHANNEL_LABELS[data.channelType as ChannelType] },
          { label: "카테고리", value: CATEGORY_LABELS[data.category as ChallengeCategory] },
          { label: "모집 마감", value: data.recruitEndsAt },
          { label: "챌린지 기간", value: `${data.startsAt} ~ ${data.endsAt}` },
          { label: "인증 주기", value: data.certFrequency === "DAILY" ? "매일" : `주/총 ${data.certFrequencyN}회` },
          { label: "성공 기준", value: `${data.certSuccessPct}%` },
          { label: "참가비", value: data.isFree ? "무료" : formatMoney(data.entryFee) },
          { label: "상금 방식", value: REWARD_MODEL_LABELS[data.rewardModel] },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-[#667085]">{label}</span>
            <span className="font-medium text-[#344054] text-right max-w-[60%] truncate">{value || "-"}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[
          { key: "agreedToTerms" as const, label: "이용약관에 동의합니다" },
          { key: "agreedToRefundPolicy" as const, label: "환급 정책에 동의합니다 (챌린지 취소 시 전액 환급)" },
          ...(data.entryFee > 0
            ? [{ key: "agreedToWithholding" as const, label: "5만원 초과 상금 원천징수(22%) 안내를 확인했습니다" }]
            : []),
        ].map(({ key, label }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => update({ [key]: !data[key] })}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                data[key] ? "bg-[#6172F3] border-[#6172F3]" : "border-[#D0D5DD]"
              }`}
            >
              {data[key] && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm text-[#344054]">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  // ── 유효성 검사 ──────────────────────────────────────────
  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (step === 1) {
      if (!data.title.trim()) errs.title = "제목을 입력해주세요";
      if (!data.description.trim()) errs.description = "소개를 입력해주세요";
      if (!data.channelType) errs.channelType = "채널을 선택해주세요";
      if (!data.category) errs.category = "카테고리를 선택해주세요";
    }
    if (step === 2) {
      if (!data.recruitEndsAt) errs.recruitEndsAt = "모집 마감일을 선택해주세요";
      if (!data.startsAt) errs.startsAt = "시작일을 선택해주세요";
      if (!data.endsAt) errs.endsAt = "종료일을 선택해주세요";
    }
    if (step === 3 && !data.isFree && data.entryFee < 1000) {
      errs.entryFee = "참가비는 최소 1,000원입니다";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── 제출 ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("생성 실패");
      const { id } = await res.json();
      router.push(`/challenges/${id}`);
    } catch {
      alert("챌린지 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 5) {
      return data.agreedToTerms && data.agreedToRefundPolicy &&
        (data.entryFee === 0 || data.agreedToWithholding);
    }
    return true;
  };

  return (
    <div className="px-4 pt-5">
      {/* 스텝 인디케이터 */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i + 1 === step ? "bg-[#6172F3] text-white"
                  : i + 1 < step ? "bg-[#D1FADF] text-[#027A48]"
                  : "bg-[#F2F4F7] text-[#98A2B3]"
              }`}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span className={`text-[9px] font-medium hidden sm:block ${i + 1 === step ? "text-[#6172F3]" : "text-[#98A2B3]"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-[#F2F4F7] rounded-full">
          <div
            className="h-full bg-[#6172F3] rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / (TOTAL - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* 스텝 제목 */}
      <h2 className="text-lg font-bold text-[#101828] mb-5">
        {STEPS[step - 1]}
      </h2>

      {/* 스텝 본문 */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3 mt-8 pb-6">
        {step > 1 && (
          <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(step - 1)}>
            이전
          </Button>
        )}
        <Button
          size="md"
          className="flex-1"
          onClick={() => {
            if (!validate()) return;
            if (step < TOTAL) setStep(step + 1);
            else handleSubmit();
          }}
          loading={loading}
          disabled={!canProceed()}
        >
          {step === TOTAL ? "챌린지 만들기" : "다음"}
        </Button>
      </div>
    </div>
  );
}
