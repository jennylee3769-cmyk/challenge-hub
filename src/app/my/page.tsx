import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy, Calendar, ChevronRight, Settings,
  CreditCard, Bell, Shield, LogOut, Star, Pencil
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { SUBSCRIPTION_LABELS } from "@/types";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { ProfileEditModal } from "@/components/my/ProfileEditModal";

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/my");

  const [participations, subscription] = await Promise.all([
    db.participation.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: "desc" },
      take: 5,
      include: {
        challenge: {
          select: { id: true, title: true, status: true, endsAt: true, coverImageUrl: true },
        },
      },
    }),
    db.managerSubscription.findUnique({ where: { userId: user.id } }),
  ]);

  const activeCount = participations.filter((p) => p.status === "ACTIVE").length;
  const successCount = participations.filter((p) => p.status === "SUCCESS").length;

  const plan = subscription?.plan ?? "FREE";

  const STATUS_KO: Record<string, string> = {
    ACTIVE: "진행 중", SUCCESS: "성공", FAILED: "실패", WITHDRAWN: "중도 포기",
  };
  const STATUS_VARIANT: Record<string, string> = {
    ACTIVE: "in_progress", SUCCESS: "approved", FAILED: "rejected", WITHDRAWN: "cancelled",
  };

  return (
    <>
      <Header title="마이페이지" variant="plain" />

      <main className="pb-24">
        {/* 프로필 카드 */}
        <div className="bg-gradient-to-br from-[#6172F3] to-[#444CE7] px-4 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden shrink-0">
              {user.profileImageUrl ? (
                <Image src={user.profileImageUrl} alt={user.nickname} width={64} height={64} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                  {user.nickname[0]}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{user.nickname}</p>
                {plan !== "FREE" && (
                  <Badge variant={plan === "PRO" ? "pro" : "standard"} className="text-xs">
                    {SUBSCRIPTION_LABELS[plan]}
                  </Badge>
                )}
              </div>
              <p className="text-white/70 text-sm mt-0.5">
                {user.role === "MANAGER" ? "챌린지 매니저" : "챌린저"}
              </p>
            </div>
            <div className="flex gap-2">
              <ProfileEditModal
                currentNickname={user.nickname}
                currentImageUrl={user.profileImageUrl ?? undefined}
              />
              <Link href="/settings" className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "참가 중", value: activeCount },
              { label: "성공", value: successCount },
              { label: "전체", value: participations.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-white/70 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 참가 중인 챌린지 */}
        <section className="px-4 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#101828]">참가 중인 챌린지</h2>
            <Link href="/my/challenges" className="text-sm text-[#6172F3] flex items-center">
              전체 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {participations.length === 0 ? (
            <div className="text-center py-8 text-[#98A2B3]">
              <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">아직 참가한 챌린지가 없어요</p>
              <Link href="/challenges" className="text-sm text-[#6172F3] mt-1 inline-block">
                챌린지 찾아보기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {participations.map((p) => (
                <Link key={p.id} href={`/challenges/${p.challenge.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl hover:bg-[#F2F4F7] transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-[#E0EAFF] overflow-hidden shrink-0">
                      {p.challenge.coverImageUrl ? (
                        <Image src={p.challenge.coverImageUrl} alt={p.challenge.title}
                          width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-[#6172F3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#101828] truncate">{p.challenge.title}</p>
                      <p className="text-xs text-[#98A2B3] mt-0.5">
                        ~{formatDate(p.challenge.endsAt)}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[p.status] as any}>
                      {STATUS_KO[p.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 메뉴 */}
        <section className="px-4 pt-5 space-y-1">
          <h2 className="font-bold text-[#101828] mb-3">설정</h2>

          {[
            { href: "/my/account", icon: CreditCard, label: "상금 수령 계좌 관리" },
            { href: "/my/calendar", icon: Calendar, label: "인증 캘린더" },
            { href: "/notifications/settings", icon: Bell, label: "알림 설정" },
            { href: "/my/identity", icon: Shield, label: "본인 인증" },
            ...(user.role === "MANAGER" || user.role === "ADMIN"
              ? [{ href: "/subscription", icon: Star, label: "구독 플랜 관리" }]
              : []),
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="w-9 h-9 bg-[#F2F4F7] rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5 text-[#344054]" />
              </div>
              <span className="flex-1 text-[#344054] font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-[#98A2B3]" />
            </Link>
          ))}

          <div className="pt-2">
            <LogoutButton />
          </div>
        </section>
      </main>

      <BottomNav role={user.role} />
    </>
  );
}
