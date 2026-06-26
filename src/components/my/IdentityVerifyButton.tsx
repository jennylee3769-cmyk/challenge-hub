"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IdentityVerifyButton() {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      // PASS 본인인증 연동 (실제 구현 시 PASS API 연동 필요)
      // 현재는 데모용으로 알림만 표시
      alert("PASS 본인인증 서비스는 실 서비스 오픈 시 연동됩니다.\n현재는 테스트 환경입니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="full" onClick={handleVerify} loading={loading} className="gap-2">
      <Shield className="h-5 w-5" />
      PASS로 본인 인증하기
    </Button>
  );
}
