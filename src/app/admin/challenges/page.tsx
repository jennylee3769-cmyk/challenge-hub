import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AdminChallengeActions } from "@/components/admin/AdminChallengeActions";

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  DRAFT:      { label: "초안",     variant: "draft" },
  REVIEWING:  { label: "심사 중",  variant: "pending" },
  RECRUITING: { label: "모집 중",  variant: "recruiting" },
  IN_PROGRESS:{ label: "진행 중",  variant: "in_progress" },
  COMPLETED:  { label: "완료",     variant: "completed" },
  CANCELLED:  { label: "취소",     variant: "cancelled" },
};

export default async function AdminChallengesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const challenges = await db.challenge.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, title: true, status: true, createdAt: true, endsAt: true,
      entryFee: true,
      manager: { select: { nickname: true } },
      _count: { select: { participations: true } },
    },
  });

  return (
    <>
      <Header title="챌린지 관리" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-2xl mx-auto">
        <div className="space-y-3">
          {challenges.map((c) => {
            const s = STATUS_MAP[c.status] ?? { label: c.status, variant: "category" };
            return (
              <div key={c.id} className="border border-[#F2F4F7] rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#101828] truncate">{c.title}</p>
                    <p className="text-xs text-[#667085] mt-0.5">
                      {c.manager.nickname} · {c._count.participations}명 · {c.entryFee.toLocaleString()}원
                    </p>
                  </div>
                  <Badge variant={s.variant as any}>{s.label}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#98A2B3]">
                    등록 {formatDate(c.createdAt)} · 종료 {formatDate(c.endsAt)}
                  </p>
                  <AdminChallengeActions challengeId={c.id} status={c.status} />
                </div>
              </div>
            );
          })}
          {challenges.length === 0 && (
            <p className="text-center py-16 text-[#98A2B3]">챌린지가 없습니다</p>
          )}
        </div>
      </main>
    </>
  );
}
