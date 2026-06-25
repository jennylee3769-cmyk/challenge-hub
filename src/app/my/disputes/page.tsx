import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  OPEN:      { label: "검토 중", variant: "pending" },
  APPROVED:  { label: "승인됨", variant: "approved" },
  REJECTED:  { label: "반려됨", variant: "rejected" },
  ESCALATED: { label: "에스컬레이션", variant: "pending" },
};

const REASON_LABELS: Record<string, string> = {
  D001: "인증 부당 반려",
  D002: "상금 계산 오류",
  D003: "챌린지 규칙 위반",
  D004: "중복 인증 오류",
  D005: "기타",
};

export default async function MyDisputesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const disputes = await db.dispute.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { challenge: { select: { id: true, title: true } } },
  });

  return (
    <>
      <Header title="이의신청 내역" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto">
        <div className="flex justify-end mb-4">
          <Link href="/my/disputes/new">
            <Button size="sm">+ 이의신청하기</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {disputes.map((d) => {
            const statusInfo = STATUS_LABELS[d.status] ?? { label: d.status, variant: "category" };
            return (
              <div key={d.id} className="border border-[#F2F4F7] rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101828] truncate">{d.challenge.title}</p>
                    <p className="text-xs text-[#667085] mt-0.5">
                      {REASON_LABELS[d.reasonCode] ?? d.reasonCode}
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                </div>
                <p className="text-sm text-[#344054] line-clamp-2">{d.comment}</p>
                {d.resolvedMemo && (
                  <div className="bg-[#F9FAFB] rounded-xl p-3">
                    <p className="text-xs text-[#667085] font-medium mb-1">처리 결과</p>
                    <p className="text-sm text-[#344054]">{d.resolvedMemo}</p>
                  </div>
                )}
                <p className="text-xs text-[#98A2B3]">{formatDate(d.createdAt)}</p>
              </div>
            );
          })}

          {disputes.length === 0 && (
            <div className="text-center py-16 text-[#98A2B3]">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>이의신청 내역이 없어요</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
