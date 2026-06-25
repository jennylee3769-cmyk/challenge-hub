import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { PayoutAccountForm } from "@/components/my/PayoutAccountForm";
import { maskAccount } from "@/lib/encrypt";
import { BANK_CODES } from "@/lib/toss";

export default async function MyAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const hasAccount = !!user.payoutSellerId;
  const maskedAccount = user.payoutAccount ? maskAccount(user.payoutAccount) : null;
  const bankName = user.payoutBankCode ? (BANK_CODES[user.payoutBankCode] ?? user.payoutBankCode) : null;

  return (
    <>
      <Header title="상금 수령 계좌" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto space-y-6">
        {/* 현재 계좌 */}
        {hasAccount && (
          <div className="bg-[#F0F4FF] rounded-2xl p-4 space-y-1">
            <p className="text-xs text-[#6172F3] font-medium">등록된 계좌</p>
            <p className="text-base font-bold text-[#101828]">
              {bankName} {maskedAccount}
            </p>
            <p className="text-sm text-[#667085]">{user.payoutHolderName}</p>
          </div>
        )}

        {/* 계좌 등록/변경 폼 */}
        <div>
          <h2 className="text-base font-semibold text-[#101828] mb-4">
            {hasAccount ? "계좌 변경" : "계좌 등록"}
          </h2>
          <PayoutAccountForm bankCodes={BANK_CODES} />
        </div>

        <div className="bg-[#F9FAFB] rounded-2xl p-4 space-y-2 text-sm text-[#667085]">
          <p className="font-semibold text-[#344054]">안내사항</p>
          <p>• 입력하신 정보는 AES-256 방식으로 암호화 저장됩니다</p>
          <p>• 본인 명의의 계좌만 등록 가능합니다</p>
          <p>• 상금은 챌린지 종료 후 7영업일 이내 입금됩니다</p>
          <p>• 5만원 초과 상금은 기타소득세 22%가 원천징수됩니다</p>
        </div>
      </main>
    </>
  );
}
