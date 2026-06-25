"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Prefs {
  certApproved: boolean;
  certRejected: boolean;
  challengeEnd: boolean;
  prizeSettled: boolean;
  newParticipant: boolean;
  disputeUpdate: boolean;
  systemNotice: boolean;
}

const ITEMS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "certApproved", label: "인증 승인", desc: "인증이 승인되면 알림을 받아요" },
  { key: "certRejected", label: "인증 반려", desc: "인증이 반려되면 알림을 받아요" },
  { key: "challengeEnd", label: "챌린지 종료", desc: "참가 중인 챌린지가 종료될 때 알림을 받아요" },
  { key: "prizeSettled", label: "상금 정산", desc: "상금이 정산되면 알림을 받아요" },
  { key: "newParticipant", label: "새 참가자 (매니저)", desc: "내 챌린지에 새 참가자가 생기면 알림을 받아요" },
  { key: "disputeUpdate", label: "이의신청 처리", desc: "이의신청 처리 결과를 알림으로 받아요" },
  { key: "systemNotice", label: "서비스 공지", desc: "공지사항 및 서비스 업데이트 알림을 받아요" },
];

export function NotificationSettings({ userId, initial }: { userId: string; initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {ITEMS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between py-3.5 border-b border-[#F2F4F7] last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-[#101828]">{label}</p>
              <p className="text-xs text-[#667085] mt-0.5">{desc}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs[key] ? "bg-[#6172F3]" : "bg-[#D0D5DD]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  prefs[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button size="full" onClick={handleSave} loading={saving}>
          저장하기
        </Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-[#027A48] shrink-0">
            <Check className="h-4 w-4" />
            <span className="text-sm">저장됨</span>
          </div>
        )}
      </div>
    </div>
  );
}
