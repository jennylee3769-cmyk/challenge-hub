import { redirect } from "next/navigation";
import { Bell, CheckCheck, Trophy, FileCheck, AlertTriangle, Megaphone } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { NotificationReadAll } from "@/components/notifications/NotificationReadAll";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  cert_approved:   { icon: FileCheck,    color: "text-[#12B76A]", bg: "bg-[#ECFDF3]" },
  cert_rejected:   { icon: FileCheck,    color: "text-[#F04438]", bg: "bg-[#FEE4E2]" },
  prize_settled:   { icon: Trophy,       color: "text-[#F79009]", bg: "bg-[#FEF0C7]" },
  challenge_end:   { icon: Trophy,       color: "text-[#6172F3]", bg: "bg-[#F5F6FE]" },
  dispute_update:  { icon: AlertTriangle,color: "text-[#F04438]", bg: "bg-[#FEE4E2]" },
  system:          { icon: Megaphone,    color: "text-[#667085]", bg: "bg-[#F2F4F7]" },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await db.notificationLog.findMany({
    where: { userId: user.id },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  return (
    <>
      <Header title="알림" variant="back" />
      <main className="max-w-lg mx-auto pb-10">
        {logs.length > 0 && (
          <div className="flex justify-end px-4 pt-3">
            <NotificationReadAll />
          </div>
        )}

        <div className="divide-y divide-[#F2F4F7]">
          {logs.map((log) => {
            const cfg = TYPE_CONFIG[log.type] ?? TYPE_CONFIG.system;
            const Icon = cfg.icon;
            const meta = log.status === "sent" ? null : log.status;
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-4">
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#101828] leading-snug">{log.recipient}</p>
                  <p className="text-xs text-[#98A2B3] mt-1">{formatDate(log.sentAt)}</p>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-20 text-[#98A2B3]">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">알림이 없어요</p>
              <p className="text-sm mt-1">챌린지 인증 결과, 상금 정산 알림이 여기에 표시됩니다</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
