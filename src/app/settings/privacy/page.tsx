import { Header } from "@/components/layout/Header";

export default function PrivacyPage() {
  return (
    <>
      <Header title="개인정보 처리방침" variant="back" />
      <main className="px-4 pt-6 pb-16 max-w-lg mx-auto">
        <div className="prose prose-sm text-[#344054] space-y-6">
          <p className="text-xs text-[#98A2B3]">최종 수정일: 2025년 1월 1일 · 시행일: 2025년 1월 1일</p>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제1조 (개인정보의 처리 목적)</h2>
            <p className="text-sm leading-relaxed">
              챌린지허브(이하 &apos;서비스&apos;)는 다음 목적으로 개인정보를 처리합니다. 처리한 개인정보는 목적
              이외의 용도로 이용하지 않으며, 목적이 변경될 경우 별도의 동의를 받겠습니다.
            </p>
            <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
              <li>회원 가입 및 관리</li>
              <li>챌린지 참가, 인증, 상금 지급</li>
              <li>결제 처리 및 환불</li>
              <li>고객 문의 응대 및 분쟁 처리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제2조 (처리하는 개인정보의 항목)</h2>
            <div className="text-sm space-y-2">
              <p className="font-medium">필수항목</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>이메일 주소, 닉네임</li>
                <li>소셜 로그인 식별자 (카카오/구글 ID)</li>
                <li>상금 수령을 위한 계좌 정보 (AES-256 암호화 보관)</li>
                <li>접속 IP, 기기 정보, 쿠키</li>
              </ul>
              <p className="font-medium mt-2">선택항목</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>프로필 사진</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>회원 탈퇴 시 즉시 삭제 (단, 법령에 따른 보존 의무 기간은 제외)</li>
              <li>전자상거래 기록: 5년 (전자상거래법)</li>
              <li>세금 관련 기록: 5년 (국세기본법)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-sm leading-relaxed">
              서비스는 원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만, 상금 지급을 위한 토스페이먼츠
              지급대행 서비스 이용 시 필요한 최소한의 정보(계좌번호, 예금주명)가 제공될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제5조 (개인정보 처리 위탁)</h2>
            <div className="text-sm overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="border border-[#E4E7EC] px-3 py-2 text-left">수탁업체</th>
                    <th className="border border-[#E4E7EC] px-3 py-2 text-left">위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-[#E4E7EC] px-3 py-2">토스페이먼츠</td><td className="border border-[#E4E7EC] px-3 py-2">결제 처리, 상금 지급대행</td></tr>
                  <tr><td className="border border-[#E4E7EC] px-3 py-2">Cloudflare</td><td className="border border-[#E4E7EC] px-3 py-2">인증 이미지 저장 (R2)</td></tr>
                  <tr><td className="border border-[#E4E7EC] px-3 py-2">Amazon SES</td><td className="border border-[#E4E7EC] px-3 py-2">이메일 발송</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제6조 (정보주체의 권리)</h2>
            <p className="text-sm leading-relaxed">
              이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
              설정 &gt; 계정 페이지에서 직접 수정하거나, 아래 연락처로 요청하시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제7조 (개인정보 보호책임자)</h2>
            <div className="text-sm bg-[#F9FAFB] rounded-xl p-4 space-y-1">
              <p>이름: 챌린지허브 개인정보 보호팀</p>
              <p>이메일: privacy@challengehub.kr</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
