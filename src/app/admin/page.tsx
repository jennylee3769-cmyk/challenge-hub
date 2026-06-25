import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Target, FileCheck, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const [
    userCount, challengeCount, certCount, openDisputeCount,
    totalRevenue, pendingSettlements,
  ] = await Promise.all([
    db.user.count(),
    db.challenge.count(),
    db.certification.count(),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.settlement.aggregate({ _sum: { grossAmount: true } }).then((r) => r._sum.grossAmount ?? 0),
    db.settlement.count({ where: { status: "PENDING" } }),
  ]);

  const recentChallenges = await db.challenge.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  const openDisputes = await db.dispute.findMany({
    where: { status: "OPEN" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { challenge: { select: { title: true } }, user: { select: { nickname: true } } },
  });

  const statCards = [
    { label: "전체 사용자", value: userCount.toLocaleString(), icon: Users, color: "bg-[#F5F6FE] text-[#6172F3]" },
    { label: "전체 챌린지", value: challengeCount.toLocaleString(), icon: Target, color: "bg-[#ECFDF3] text-[#12B76A]" },
    { label: "전체 인증", value: certCount.toLocaleString(), icon: FileCheck, color: "bg-[#FEF0C7] text-[#F79009]" },
    { label: "미처리 이의신청", value: openDisputeCount.toLocaleString(), icon: AlertTriangle, color: "bg-[#FEE4E2] text-[#F04438]" },
    { label: "총 정산 금액", value: formatMoney(totalRevenue), icon: DollarSign, color: "bg-[#F0F9FF] text-[#0BA5EC]" },
    { label: "정산 대기", value: `${pendingSettlements}건`, icon: TrendingUp, color: "bg-[#F9F5FF] text-[#7F56D9]" },
  ];

  return (
    <>
      <Header title="관리자 대시보드" />
      <main className="px-4 pt-6 pb-10 max-w-2xl mx-auto space-y-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-[#F2F4F7] rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xl font-bold text-[#101828]">{value}</p>
              <p className="text-xs text-[#667085] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 빠른 액션 */}
        <div>
          <h2 className="text-sm font-semibold text-[#344054] mb-3">관리 메뉴</h2>
          <div className="grid grid-cols-1 gap-2">
            {[
              { href: "/admin/challenges", label: "챌린지 관리", desc: "상태 변경, 정산 처리" },
              { href: "/admin/certifications", label: "인증 관리", desc: "대량 승인/반려" },
              { href: "/admin/disputes", label: "이의신청 처리", desc: `미처리 ${openDisputeCount}건` },
              { href: "/admin/users", label: "사용자 관리", desc: "계정 정지, 권한 변경" },
              { href: "/admin/settlements", label: "정산 현황", desc: `대기 ${pendingSettlements}건` },
            ].map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-4 bg-white border border-[#F2F4F7] rounded-2xl hover:border-[#6172F3] transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-[#101828]">{label}</p>
                  <p className="text-xs text-[#667085]">{desc}</p>
                </div>
                <span className="text-[#98A2B3]">›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 챌린지 */}
        <div>
          <h2 className="text-sm font-semibold text-[#344054] mb-3">최근 등록 챌린지</h2>
          <div className="space-y-2">
            {recentChallenges.map((c) => (
              <Link
                key={c.id}
                href={`/manage/challenges/${c.id}`}
                className="flex items-center justify-between p-3 bg-white border border-[#F2F4F7] rounded-xl text-sm"
              >
                <span className="text-[#101828] truncate flex-1">{c.title}</span>
                <span className="text-xs text-[#98A2B3] shrink-0 ml-2">{c.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 미처리 이의신청 */}
        {openDisputes.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#344054] mb-3">미처리 이의신청</h2>
            <div className="space-y-2">
              {openDisputes.map((d) => (
                <div key={d.id} className="p-3 bg-[#FEF0C7]/30 border border-[#FDB022]/20 rounded-xl">
                  <p className="text-sm font-medium text-[#101828]">{d.challenge.title}</p>
                  <p className="text-xs text-[#667085]">{d.user.nickname} · {d.comment.slice(0, 50)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
