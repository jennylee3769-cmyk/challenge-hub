import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AdminDisputeActions } from "@/components/admin/AdminDisputeActions";

const REASON_LABELS: Record<string, string> = {
  D001: "인증 부당 반려", D002: "상금 계산 오류",
  D003: "챌린지 규칙 위반", D004: "중복 인증 오류", D005: "기타",
};

export default async function AdminDisputesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const disputes = await db.dispute.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { nickname: true } },
      challenge: { select: { title: true } },
    },
  });

  return (
    <>
      <Header title="이의신청 처리" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-2xl mx-auto">
        <p className="text-sm text-[#667085] mb-4">미처리 이의신청 {disputes.length}건</p>
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="border border-[#F2F4F7] rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-[#101828]">{d.challenge.title}</p>
                  <p className="text-xs text-[#667085] mt-0.5">
                    {d.user.nickname} · {REASON_LABELS[d.reasonCode] ?? d.reasonCode}
                  </p>
                </div>
                <Badge variant="pending">검토 중</Badge>
              </div>
              <p className="text-sm text-[#344054] bg-[#F9FAFB] rounded-xl p-3">{d.comment}</p>
              <p className="text-xs text-[#98A2B3]">{formatDate(d.createdAt)}</p>
              <AdminDisputeActions disputeId={d.id} />
            </div>
          ))}
          {disputes.length === 0 && (
            <div className="text-center py-16 text-[#98A2B3]">
              <p>미처리 이의신청이 없어요</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
