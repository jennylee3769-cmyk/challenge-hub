import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, User, CreditCard, Bell, Shield, LogOut, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/shared/LogoutButton";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const menuGroups = [
    {
      title: "계정",
      items: [
        { href: "/my", icon: <User className="h-5 w-5" />, label: "프로필 편집" },
        { href: "/my/account", icon: <CreditCard className="h-5 w-5" />, label: "상금 수령 계좌" },
      ],
    },
    {
      title: "서비스",
      items: [
        { href: "/subscription", icon: <Star className="h-5 w-5" />, label: "구독 관리", badge: user.subscription?.plan === "PRO" ? "PRO" : undefined },
        { href: "/settings/notifications", icon: <Bell className="h-5 w-5" />, label: "알림 설정" },
        { href: "/settings/privacy", icon: <Shield className="h-5 w-5" />, label: "개인정보 처리방침" },
      ],
    },
  ];

  return (
    <>
      <Header title="설정" variant="back" />
      <main className="pb-10 max-w-lg mx-auto">
        <div className="px-4 pt-4 space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide mb-2 px-1">
                {group.title}
              </p>
              <div className="bg-white rounded-2xl border border-[#F2F4F7] overflow-hidden">
                {group.items.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#F9FAFB] transition-colors ${
                      i > 0 ? "border-t border-[#F2F4F7]" : ""
                    }`}
                  >
                    <span className="text-[#667085]">{item.icon}</span>
                    <span className="flex-1 text-sm font-medium text-[#344054]">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-[#6172F3] text-white px-2 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-[#98A2B3]" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* 로그아웃 */}
          <div className="bg-white rounded-2xl border border-[#F2F4F7] overflow-hidden">
            <LogoutButton />
          </div>

          <p className="text-xs text-center text-[#98A2B3] pb-4">
            챌린지허브 v1.0.0 · {user.email}
          </p>
        </div>
      </main>
    </>
  );
}
