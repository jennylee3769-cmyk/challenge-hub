import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  PENDING: { label: "대기", variant: "pending" },
  PAID:    { label: "지급 완료", variant: "approved" },
  FAILED:  { label: "실패", variant: "rejected" },
  REFUNDED:{ label: "환불", variant: "cancelled" },
};

export default async function AdminSettlementsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const settlements = await db.settlement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      challenge: { select: { title: true } },
      participation: { include: { user: { select: { nickname: true, email: true } } } },
    },
  });

  const totalPaid = settlements.filter((s) => s.status === "PAID").reduce((sum, s) => sum + s.netAmount, 0);
  const totalTax = settlements.filter((s) => s.status === "PAID").reduce((sum, s) => sum + s.taxAmount, 0);
  const pendingCount = settlements.filter((s) => s.status === "PENDING").length;

  return (
    <>
      <Header title="정산 현황" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-2xl mx-auto space-y-5">
        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "지급 완료", value: formatMoney(totalPaid) },
            { label: "원천징수", value: formatMoney(totalTax) },
            { label: "대기 건수", value: `${pendingCount}건` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F9FAFB] rounded-2xl p-3 text-center">
              <p className="text-base font-bold text-[#101828]">{value}</p>
              <p className="text-xs text-[#667085] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 목록 */}
        <div className="space-y-3">
          {settlements.map((s) => {
            const st = STATUS_MAP[s.status] ?? { label: s.status, variant: "category" };
            return (
              <div key={s.id} className="border border-[#F2F4F7] rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-[#101828]">{s.challenge.title}</p>
                    <p className="text-xs text-[#667085]">{s.participation.user.nickname} · {s.participation.user.email}</p>
                  </div>
                  <Badge variant={st.variant as any}>{st.label}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#344054]">
                  <span>총액 {formatMoney(s.grossAmount)}</span>
                  <span className="text-[#F04438]">세금 -{formatMoney(s.taxAmount)}</span>
                  <span className="font-semibold text-[#101828]">실수령 {formatMoney(s.netAmount)}</span>
                </div>
                <p className="text-xs text-[#98A2B3]">{formatDate(s.createdAt)}</p>
              </div>
            );
          })}
          {settlements.length === 0 && (
            <p className="text-center py-16 text-[#98A2B3]">정산 내역이 없습니다</p>
          )}
        </div>
      </main>
    </>
  );
}
