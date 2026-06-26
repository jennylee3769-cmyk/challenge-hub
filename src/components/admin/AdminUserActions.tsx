"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({
  userId, isBanned, currentRole,
}: { userId: string; isBanned: boolean; currentRole: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleBan = async () => {
    if (!confirm(isBanned ? "정지를 해제하시겠습니까?" : "이 사용자를 정지하시겠습니까?")) return;
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned }),
    });
    router.refresh();
    setLoading(false);
  };

  const changeRole = async (role: string) => {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={toggleBan} disabled={loading}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 ${
          isBanned
            ? "bg-[#ECFDF3] text-[#027A48]"
            : "bg-[#FEE4E2] text-[#B42318]"
        }`}>
        {isBanned ? "정지 해제" : "계정 정지"}
      </button>
      {currentRole === "USER" && (
        <button onClick={() => changeRole("MANAGER")} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#F5F6FE] text-[#3538CD] font-medium disabled:opacity-50">
          매니저 승격
        </button>
      )}
      {currentRole === "MANAGER" && (
        <button onClick={() => changeRole("USER")} disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#F2F4F7] text-[#344054] font-medium disabled:opacity-50">
          일반 회원으로
        </button>
      )}
    </div>
  );
}
