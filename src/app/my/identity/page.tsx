import { redirect } from "next/navigation";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { IdentityVerifyButton } from "@/components/my/IdentityVerifyButton";

export default async function IdentityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // identityVerification 모델은 추후 PASS API 연동 시 추가 예정
  const isVerified = false;

  return (
    <>
      <Header title="본인 인증" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto space-y-5">
        {/* 상태 카드 */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${isVerified ? "bg-[#ECFDF3]" : "bg-[#F5F6FE]"}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isVerified ? "bg-[#12B76A]/10" : "bg-[#6172F3]/10"}`}>
            {isVerified
              ? <CheckCircle className="h-6 w-6 text-[#12B76A]" />
              : <Shield className="h-6 w-6 text-[#6172F3]" />
            }
          </div>
          <div>
            <p className={`font-bold text-lg ${isVerified ? "text-[#027A48]" : "text-[#3538CD]"}`}>
              {isVerified ? "인증 완료" : "미인증"}
            </p>
            <p className="text-sm text-[#667085]">
              {isVerified ? "본인 인증이 완료된 계정입니다" : "상금 수령을 위해 본인 인증이 필요해요"}
            </p>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-[#F9FAFB] rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-[#344054]">본인 인증이 필요한 이유</p>
          <ul className="text-sm text-[#667085] space-y-1 list-disc pl-4">
            <li>상금 5만원 초과 시 원천징수 신고를 위해 실명 확인이 필요합니다</li>
            <li>1인 1계정 원칙을 지키기 위한 중복 가입 방지</li>
            <li>부정 참가 방지 및 챌린지 신뢰도 향상</li>
          </ul>
        </div>

        {!isVerified && (
          <div className="space-y-3">
            <IdentityVerifyButton />
            <p className="text-xs text-center text-[#98A2B3]">
              통신사 PASS 앱을 통한 본인 인증이 진행됩니다
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#FFFAEB] rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F79009] shrink-0" />
          <p className="text-sm text-[#B54708]">
            PASS 본인인증은 실 서비스 오픈 시 연동 예정입니다
          </p>
        </div>
      </main>
    </>
  );
}
