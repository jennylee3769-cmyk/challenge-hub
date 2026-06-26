import { redirect } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AdminUserActions } from "@/components/admin/AdminUserActions";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, nickname: true, email: true, role: true,
      profileImageUrl: true, createdAt: true, deletedAt: true,
    },
  });

  const ROLE_LABELS: Record<string, string> = { USER: "챌린저", MANAGER: "매니저", ADMIN: "어드민" };
  const ROLE_VARIANT: Record<string, string> = { USER: "category", MANAGER: "recruiting", ADMIN: "approved" };

  return (
    <>
      <Header title="사용자 관리" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-2xl mx-auto">
        <p className="text-sm text-[#667085] mb-4">전체 {users.length}명</p>
        <div className="space-y-3">
          {users.map((u) => {
            const isBanned = !!u.deletedAt;
            return (
              <div key={u.id} className={`border rounded-2xl p-4 space-y-3 ${isBanned ? "border-[#F04438]/30 bg-[#FEE4E2]/20" : "border-[#F2F4F7]"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E0EAFF] overflow-hidden shrink-0">
                    {u.profileImageUrl ? (
                      <Image src={u.profileImageUrl} alt={u.nickname} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[#6172F3]">
                        {u.nickname[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-[#101828]">{u.nickname}</p>
                      {isBanned && <Badge variant="rejected">정지</Badge>}
                    </div>
                    <p className="text-xs text-[#667085]">{u.email} · 가입 {formatDate(u.createdAt)}</p>
                  </div>
                  <Badge variant={ROLE_VARIANT[u.role] as any}>{ROLE_LABELS[u.role]}</Badge>
                </div>
                <AdminUserActions userId={u.id} isBanned={isBanned} currentRole={u.role} />
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
