import { Header } from "@/components/layout/Header";

export default function TermsPage() {
  return (
    <>
      <Header title="이용약관" variant="back" />
      <main className="px-4 pt-6 pb-16 max-w-lg mx-auto">
        <div className="text-[#344054] space-y-6">
          <p className="text-xs text-[#98A2B3]">최종 수정일: 2025년 1월 1일 · 시행일: 2025년 1월 1일</p>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제1조 (목적)</h2>
            <p className="text-sm leading-relaxed">
              본 약관은 챌린지허브(이하 &apos;서비스&apos;)가 제공하는 모든 서비스의 이용 조건 및 절차,
              서비스 이용자와 서비스 운영자 간의 권리, 의무, 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제2조 (정의)</h2>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li><strong>서비스</strong>: 챌린지허브가 제공하는 챌린지 개설, 참가, 인증, 상금 지급 플랫폼</li>
              <li><strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 자</li>
              <li><strong>챌린저</strong>: 챌린지에 참가하여 인증을 제출하는 이용자</li>
              <li><strong>매니저</strong>: 챌린지를 개설하고 운영하는 이용자</li>
              <li><strong>상금 풀</strong>: 챌린지 참가비에서 수수료를 제외한 성공자 분배 금액</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제3조 (서비스 이용)</h2>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>서비스 이용을 위해서는 소셜 계정(카카오 또는 구글)으로 가입해야 합니다.</li>
              <li>만 14세 미만의 이용자는 서비스를 이용할 수 없습니다.</li>
              <li>상금 수령을 위해서는 본인 명의 계좌 등록 및 본인 인증이 필요합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제4조 (챌린지 운영)</h2>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>챌린지 매니저는 서비스 가이드라인에 맞는 챌린지만 개설할 수 있습니다.</li>
              <li>허위 인증, 어뷰징 행위가 확인된 경우 참가 자격이 박탈될 수 있습니다.</li>
              <li>상금은 챌린지 종료 후 영업일 기준 5일 이내 지급됩니다.</li>
              <li>상금 지급 시 5만원 초과분에 대해 22%의 원천징수가 적용됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제5조 (수수료)</h2>
            <ul className="text-sm space-y-2 list-disc pl-5">
              <li>플랫폼 수수료: 상금 풀의 7%</li>
              <li>매니저 수수료: 챌린지 개설 시 설정 (최대 30%)</li>
              <li>결제 수수료: 토스페이먼츠 정책에 따름</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제6조 (서비스 중단)</h2>
            <p className="text-sm leading-relaxed">
              서비스는 시스템 점검, 천재지변 등 불가피한 사유로 서비스를 일시 중단할 수 있습니다.
              예정된 중단의 경우 사전 공지하며, 긴급 중단 시 사후 고지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제7조 (책임 제한)</h2>
            <p className="text-sm leading-relaxed">
              서비스는 이용자 간 분쟁에 대해 중재 역할을 수행하나, 직접적인 법적 책임을 지지 않습니다.
              이용자의 부정한 방법에 의한 손해에 대해서는 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#101828] mb-2">제8조 (문의)</h2>
            <div className="text-sm bg-[#F9FAFB] rounded-xl p-4">
              <p>이메일: support@challengehub.kr</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
