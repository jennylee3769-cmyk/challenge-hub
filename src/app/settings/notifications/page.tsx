import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const defaults = {
    certApproved: true,
    certRejected: true,
    challengeEnd: true,
    prizeSettled: true,
    newParticipant: true,
    disputeUpdate: true,
    systemNotice: true,
  };

  return (
    <>
      <Header title="알림 설정" variant="back" />
      <main className="px-4 pt-6 pb-10 max-w-lg mx-auto">
        <NotificationSettings userId={user.id} initial={defaults} />
      </main>
    </>
  );
}
